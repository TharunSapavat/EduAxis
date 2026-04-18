import User from '../models/User.js';
import Course from '../models/Course.js';
import LibraryResource from '../models/LibraryResource.js';
import { cacheKey, getOrSetCache } from '../services/cacheService.js';
import { searchWithSolr } from '../services/solrSearchService.js';

const SEARCH_CACHE_TTL = 120;

const normalizeLimit = (limit) => {
  const parsed = Number(limit);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 10;
  }

  return Math.min(parsed, 50);
};

const buildRegex = (query) => ({ $regex: query, $options: 'i' });

const searchWithMongo = async ({ schoolId, query, type, limit }) => {
  if (type === 'users') {
    const users = await User.find({
      schoolId,
      $or: [{ name: buildRegex(query) }, { email: buildRegex(query) }, { subject: buildRegex(query) }]
    })
      .select('_id name email role subject grade status')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return users.map((user) => ({ ...user, type: 'users' }));
  }

  if (type === 'courses') {
    const courses = await Course.find({
      schoolId,
      $or: [{ name: buildRegex(query) }, { code: buildRegex(query) }, { description: buildRegex(query) }]
    })
      .select('_id name code description grade semester status teacher')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return courses.map((course) => ({ ...course, type: 'courses' }));
  }

  if (type === 'library') {
    const resources = await LibraryResource.find({
      schoolId,
      isActive: true,
      $or: [{ title: buildRegex(query) }, { description: buildRegex(query) }, { author: buildRegex(query) }]
    })
      .select('_id title description author category tags grade isExternal linkUrl file')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return resources.map((resource) => ({ ...resource, type: 'library' }));
  }

  const [users, courses, library] = await Promise.all([
    User.find({ schoolId, $text: { $search: query } })
      .select('_id name email role subject grade status')
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean(),
    Course.find({ schoolId, $text: { $search: query } })
      .select('_id name code description grade semester status teacher')
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean(),
    LibraryResource.find({ schoolId, isActive: true, $text: { $search: query } })
      .select('_id title description author category tags grade isExternal linkUrl file')
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean()
  ]);

  return [
    ...users.map((entry) => ({ ...entry, type: 'users' })),
    ...courses.map((entry) => ({ ...entry, type: 'courses' })),
    ...library.map((entry) => ({ ...entry, type: 'library' }))
  ].slice(0, limit);
};

export const globalSearch = async (req, res) => {
  try {
    const schoolId = req.schoolId;
    const query = String(req.query.q || '').trim();
    const type = String(req.query.type || 'all').trim().toLowerCase();
    const limit = normalizeLimit(req.query.limit);

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const key = cacheKey('search', [schoolId, type, limit, query]);
    const { payload, cacheHit } = await getOrSetCache(
      key,
      async () => {
        try {
          const solrDocs = await searchWithSolr({ term: query, schoolId: String(schoolId), limit, type: type === 'all' ? undefined : type });
          if (solrDocs && solrDocs.length) {
            return {
              success: true,
              source: 'solr',
              type,
              total: solrDocs.length,
              items: solrDocs
            };
          }
        } catch (error) {
          console.warn('[SEARCH] Solr fallback to Mongo:', error.message);
        }

        const items = await searchWithMongo({ schoolId, query, type, limit });
        return {
          success: true,
          source: 'mongo',
          type,
          total: items.length,
          items
        };
      },
      SEARCH_CACHE_TTL
    );

    res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS');
    return res.json(payload);
  } catch (error) {
    console.error('Global search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

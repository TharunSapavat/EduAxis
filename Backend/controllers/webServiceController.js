import Course from '../models/Course.js';
import School from '../models/School.js';
import User from '../models/User.js';

const fetchWithTimeout = async (url, timeoutMs = 7000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const normalizeCountryCode = (countryCode) => {
  const candidate = String(countryCode || '').trim().toUpperCase();
  return candidate.length === 2 ? candidate : 'IN';
};

const normalizeYear = (yearValue) => {
  const parsed = Number(yearValue);
  const nowYear = new Date().getFullYear();
  if (Number.isNaN(parsed) || parsed < 2000 || parsed > nowYear + 2) {
    return nowYear;
  }

  return parsed;
};

const buildHolidayEndpoint = (year, countryCode) => {
  return `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
};

export const getPublicHolidaysB2C = async (req, res) => {
  try {
    const countryCode = normalizeCountryCode(req.query.countryCode || req.school?.address?.country || 'IN');
    const year = normalizeYear(req.query.year);
    const endpoint = buildHolidayEndpoint(year, countryCode);

    const holidays = await fetchWithTimeout(endpoint);

    return res.json({
      success: true,
      source: 'external',
      integration: 'nager-public-holidays',
      filters: { year, countryCode },
      total: holidays.length,
      items: holidays
    });
  } catch (error) {
    console.error('B2C holidays integration failed:', error.message);
    return res.status(502).json({
      success: false,
      message: 'External holiday service unavailable',
      error: error.message
    });
  }
};

export const getExchangeRatesB2C = async (req, res) => {
  try {
    const baseCurrency = String(req.query.base || 'INR').trim().toUpperCase();
    const targetCurrency = String(req.query.target || 'USD').trim().toUpperCase();
    const endpoint = `https://api.frankfurter.app/latest?from=${baseCurrency}&to=${targetCurrency}`;

    const rates = await fetchWithTimeout(endpoint);

    return res.json({
      success: true,
      source: 'external',
      integration: 'frankfurter-exchange-rates',
      rates
    });
  } catch (error) {
    console.error('B2C exchange-rate integration failed:', error.message);
    return res.status(502).json({
      success: false,
      message: 'External exchange-rate service unavailable',
      error: error.message
    });
  }
};

export const getSchoolSummaryB2B = async (req, res) => {
  try {
    const { schoolId } = req.params;

    const school = await School.findById(schoolId).select('name code status stats subscription.plan createdAt').lean();
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    const [activeStudents, activeTeachers, activeCourses] = await Promise.all([
      User.countDocuments({ schoolId, role: 'student', status: 'active' }),
      User.countDocuments({ schoolId, role: 'teacher', status: 'active' }),
      Course.countDocuments({ schoolId, status: 'active' })
    ]);

    return res.json({
      success: true,
      b2b: true,
      client: req.b2bClient,
      school: {
        id: schoolId,
        name: school.name,
        code: school.code,
        status: school.status,
        subscriptionPlan: school.subscription?.plan,
        createdAt: school.createdAt,
        stats: {
          activeStudents,
          activeTeachers,
          activeCourses,
          registeredStudents: school.stats?.totalStudents || 0,
          registeredTeachers: school.stats?.totalTeachers || 0,
          registeredAdmins: school.stats?.totalAdmins || 0
        }
      }
    });
  } catch (error) {
    console.error('B2B school summary failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getPublicHolidaysB2B = async (req, res) => {
  try {
    const countryCode = normalizeCountryCode(req.query.countryCode || 'IN');
    const year = normalizeYear(req.query.year);
    const endpoint = buildHolidayEndpoint(year, countryCode);

    const holidays = await fetchWithTimeout(endpoint);

    return res.json({
      success: true,
      b2b: true,
      source: 'external',
      integration: 'nager-public-holidays',
      client: req.b2bClient,
      filters: { year, countryCode },
      total: holidays.length,
      items: holidays
    });
  } catch (error) {
    console.error('B2B holidays integration failed:', error.message);
    return res.status(502).json({
      success: false,
      message: 'External holiday service unavailable',
      error: error.message
    });
  }
};

import solr from 'solr-node';

let solrClient;

const getSolrConfig = () => ({
  host: process.env.SOLR_HOST || '127.0.0.1',
  port: process.env.SOLR_PORT || '8983',
  core: process.env.SOLR_CORE || 'eduaxis',
  protocol: process.env.SOLR_PROTOCOL || 'http'
});

const isSolrEnabled = () => process.env.SOLR_ENABLED === 'true';

const getClient = () => {
  if (solrClient) {
    return solrClient;
  }

  const config = getSolrConfig();
  solrClient = new solr(config);
  return solrClient;
};

export const searchWithSolr = async ({ term, schoolId, limit = 10, type }) => {
  if (!isSolrEnabled()) {
    return null;
  }

  const client = getClient();
  const query = client
    .query()
    .q(term ? `text:${term}*` : '*:*')
    .addParams({
      wt: 'json',
      rows: Math.min(Number(limit) || 10, 50),
      fq: [
        `schoolId:${schoolId}`,
        ...(type ? [`type:${type}`] : [])
      ]
    });

  return new Promise((resolve, reject) => {
    client.search(query, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result?.response?.docs || []);
    });
  });
};

export const isSolrSearchEnabled = isSolrEnabled;

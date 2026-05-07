module.exports = ({ env }) => ({
  host: env('HOST', '::'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_SERVER_URL', `http://localhost:${env.int('PORT', 1337)}`),
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});

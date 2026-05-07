const allowedOrigins = process.env.ALLOWED_PLUGIN_ORIGINS
  ? process.env.ALLOWED_PLUGIN_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : ['https://www.figma.com', 'https://www.figma.com/plugin-sandbox'];

if (!allowedOrigins.includes('null')) {
  allowedOrigins.push('null');
}

module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    resolve: './src/middlewares/private-network',
  },
  {
    name: 'strapi::cors',
    config: {
      origin: allowedOrigins,
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      jsonLimit: '25mb',
      formLimit: '25mb',
      textLimit: '25mb',
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

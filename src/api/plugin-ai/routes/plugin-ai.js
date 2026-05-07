'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/plugin-ai/generate-persona',
      handler: 'plugin-ai.generatePersona',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/plugin-ai/generate-context',
      handler: 'plugin-ai.generateContext',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/plugin-ai/analyze-frame',
      handler: 'plugin-ai.analyzeFrame',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/plugin-ai/discuss-analysis',
      handler: 'plugin-ai.discussAnalysis',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/plugin-ai/track-question',
      handler: 'plugin-ai.trackQuestion',
      config: {
        auth: false,
      },
    },
  ],
};

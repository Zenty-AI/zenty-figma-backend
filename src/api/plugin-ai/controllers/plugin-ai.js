'use strict';

const createPluginAiService = require('../services/plugin-ai');

const getService = () => createPluginAiService({ strapi });

module.exports = {
  async generatePersona(ctx) {
    ctx.body = await getService().generatePersona(ctx.request.body || {});
  },

  async generateContext(ctx) {
    ctx.body = await getService().generateContext(ctx.request.body || {});
  },

  async analyzeFrame(ctx) {
    ctx.body = await getService().analyzeFrame(ctx.request.body || {});
  },

  async discussAnalysis(ctx) {
    ctx.body = await getService().discussAnalysis(ctx.request.body || {});
  },

  async trackQuestion(ctx) {
    ctx.body = await getService().trackQuestion(ctx);
  },
};

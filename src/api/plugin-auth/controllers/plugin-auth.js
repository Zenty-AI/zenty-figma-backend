'use strict';

const createPluginAuthService = require('../services/plugin-auth');

const getService = () => createPluginAuthService({ strapi });

module.exports = {
  async githubStart(ctx) {
    const locale = ctx.request.body?.locale === 'en' ? 'en' : 'ru';
    ctx.body = await getService().githubStart(locale);
  },

  async githubStatus(ctx) {
    ctx.body = await getService().githubStatus(ctx.query.state);
  },

  async githubCallback(ctx) {
    ctx.type = 'html';
    ctx.body = await getService().githubCallback(ctx.query);
  },

  async me(ctx) {
    ctx.body = await getService().me(ctx);
  },
};

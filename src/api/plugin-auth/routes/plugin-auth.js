'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/plugin-auth/github/start',
      handler: 'plugin-auth.githubStart',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/plugin-auth/github/status',
      handler: 'plugin-auth.githubStatus',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/plugin-auth/github/callback',
      handler: 'plugin-auth.githubCallback',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/plugin-auth/me',
      handler: 'plugin-auth.me',
      config: {
        auth: false,
      },
    },
  ],
};

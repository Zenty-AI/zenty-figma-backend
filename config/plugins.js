module.exports = ({ env }) => ({
  'users-permissions': {
    config: {
      pluginAuth: {
        githubClientId: env('GITHUB_CLIENT_ID'),
        githubClientSecret: env('GITHUB_CLIENT_SECRET'),
        githubScope: env.array('GITHUB_SCOPE', ['read:user', 'user:email']),
        publicServerUrl: env(
          'PUBLIC_SERVER_URL',
          `http://${env('HOST', '127.0.0.1')}:${env.int('PORT', 1337)}`
        ),
        githubCallbackPath: env('GITHUB_CALLBACK_PATH', '/api/plugin-auth/github/callback'),
        stateTtlMs: env.int('PLUGIN_AUTH_STATE_TTL_MS', 600000),
      },
    },
  },
});

const { mergeConfig } = require('vite');

module.exports = (config) => {
  return mergeConfig(config, {
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      watch: {
        ignored: ['**/.tmp/**', '**/dist/**', '**/build/**', '**/.cache/**', '**/public/uploads/**'],
      },
    },
  });
};

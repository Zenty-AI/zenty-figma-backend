'use strict';

module.exports = () => {
  return async (ctx, next) => {
    await next();

    if (ctx.get('Access-Control-Request-Private-Network')) {
      ctx.set('Access-Control-Allow-Private-Network', 'true');
    }
  };
};

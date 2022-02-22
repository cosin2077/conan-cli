

const Router = require('koa-router');

const router = new Router();

/**
 * Base route, return a 401
 */
router.get('/', async ctx => ctx.body = 'hello from nodejs server...');

/**
 * Basic healthcheck
 */
router.get('/healthcheck', async ctx => ctx.body = 'OK');

const routes = router.routes();
module.exports = {
  routes
}
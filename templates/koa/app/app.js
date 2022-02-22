const Koa = require('koa');
const koaBody = require('koa-body');
const cors = require('@koa/cors');

const serve = require('koa-static');
const { koaSwagger } = require('koa2-swagger-ui');
const koaBunyanLogger = require('koa-bunyan-logger');

const { config } = require('./config');
const { routes } = require('./router/routes');
const { logger } = require('./logger');

const app = new Koa();

app.use(koaBody());
app.use(cors());
app.use(koaBunyanLogger(logger));
app.use(koaBunyanLogger.requestLogger());
app.use(koaBunyanLogger.timeContext());
app.use(routes);
app.use(serve('public'));
app.use(
  koaSwagger({
    routePrefix: '/swagger',
    swaggerOptions: {
      url: '/swagger.yml'
    }
  })
);
let server = null;
const listen = () => {
  server = app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
  }).on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.log(`port ${config.port} is in use, try another port...`);
      config.port++
      return setTimeout(listen, 200)
    }
  });  
}
listen();
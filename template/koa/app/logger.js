const path = require('path');
const bunyan = require('bunyan');

const logger = bunyan.createLogger({
  name: require(path.resolve(__dirname, '../package.json')).name,
  level: (process.env.LOG_LEVEL) || 'debug',
  serializers: bunyan.stdSerializers
});
module.exports = {
  logger
}
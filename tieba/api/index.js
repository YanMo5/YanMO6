const serverless = require('serverless-http');
const path = require('path');
// require the app exported from server.js
const app = require(path.join(__dirname, '..', 'server'));

module.exports = serverless(app);

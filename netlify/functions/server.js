const serverless = require('serverless-http');
const server = require('../../server.js');

const handler = serverless(server, {
  request: (req, event, context) => {
    // 确保路径正确
    return req;
  }
});

exports.handler = handler;

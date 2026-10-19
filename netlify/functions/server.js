const path = require('path');
const http = require('http');

// 加载 server.js 但不启动监听
process.env.NETLIFY = 'true';
const server = require('../../server.js');

// 将 Netlify event 转换为 http request
function eventToRequest(event) {
  const headers = event.headers || {};
  const method = event.httpMethod || 'GET';
  const rawQuery = event.rawQuery || '';
  const url = event.rawUrl || event.path + (rawQuery ? '?' + rawQuery : '');

  const req = new http.IncomingMessage(null);
  req.method = method;
  req.url = url;
  req.headers = headers;

  // Netlify 提供 event.body，需要模拟 stream 触发 data/end 事件
  const bodyBuffer = event.body
    ? Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8')
    : Buffer.alloc(0);

  // 异步推送到 stream，让 parseBody 的事件监听器能接收到
  process.nextTick(() => {
    if (bodyBuffer.length > 0) req.emit('data', bodyBuffer);
    req.emit('end');
  });

  return req;
}

// 捕获 http response 并转换为 Netlify response
function getResponse(res) {
  return new Promise((resolve) => {
    const chunks = [];
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);

    res.write = function(chunk) {
      if (chunk) chunks.push(Buffer.from(chunk));
      return true;
    };

    res.end = function(chunk) {
      if (chunk) chunks.push(Buffer.from(chunk));
      const body = Buffer.concat(chunks);
      resolve({
        statusCode: res.statusCode,
        headers: res.getHeaders(),
        body: body.toString('base64'),
        isBase64Encoded: true
      });
      return originalEnd();
    };
  });
}

exports.handler = async (event, context) => {
  const req = eventToRequest(event);
  const res = new http.ServerResponse(req);

  const responsePromise = getResponse(res);
  server.emit('request', req, res);

  return await responsePromise;
};

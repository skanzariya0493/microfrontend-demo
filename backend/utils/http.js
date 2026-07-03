function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let rawBody = '';

    req.on('data', (chunk) => {
      rawBody += chunk;

      if (rawBody.length > 1_000_000) {
        const error = new Error('Request body too large');
        error.statusCode = 413;
        reject(error);
      }
    });

    req.on('end', () => {
      if (!rawBody) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch {
        const error = new Error('Invalid JSON body');
        error.statusCode = 400;
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

function notFound(res) {
  sendJson(res, 404, { message: 'API route not found' });
}

module.exports = {
  notFound,
  readJsonBody,
  sendJson,
};

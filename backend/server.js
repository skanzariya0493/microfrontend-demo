const http = require('http');
const { env } = require('./config/env');
const { handleApiRoutes } = require('./routes');
const cors = require("cors");

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    send(res, 204);
    return;
  }

  try {
    await handleApiRoutes(req, res);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    send(res, statusCode, {
      message: error.message || 'Internal server error',
    });
  }
});

server.use(cors({
  origin:[
    "http://localhost:4200",
    "https://shell-i86z.onrender.com"
  ],
  methods:["GET","POST","PUT","DELETE"]
}));

server.use(cors());
server.listen(env.port, () => {
  console.log(`Backend API running on http://localhost:${env.port}`);
});

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', env.corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function send(res, statusCode, payload) {
  res.statusCode = statusCode;

  if (!payload) {
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

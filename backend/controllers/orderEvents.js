const { verifyJwt } = require("../utils/jwt");

// In-memory set of connected SSE clients: { res, userId, isSuper }
const clients = new Set();

// GET /api/order/stream?token=<jwt>
// EventSource cannot send an Authorization header, so the token comes via query.
function streamOrders(req, res) {
  const token = req.query.token || "";
  let user;
  try {
    const payload = verifyJwt(token);
    user = { id: payload.sub, role: payload.role };
  } catch {
    res.statusCode = 401;
    res.end();
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "X-Accel-Buffering": "no",
  });
  res.write("event: connected\ndata: \"ok\"\n\n");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  const client = {
    res,
    userId: user.id,
    isSuper: user.role === "super_admin",
  };
  clients.add(client);

  // Heartbeat so proxies (Render) don't drop the idle connection
  const heartbeat = setInterval(() => {
    res.write(": ping\n\n");
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(client);
  });
}

// Push an updated order to the clients allowed to see it:
// the customer who owns it, plus any connected super admin.
function broadcastOrderUpdate(order) {
  const message = `event: order-updated\ndata: ${JSON.stringify(order)}\n\n`;
  for (const client of clients) {
    if (client.isSuper || client.userId === order.userId) {
      try {
        client.res.write(message);
      } catch {
        clients.delete(client);
      }
    }
  }
}

module.exports = { streamOrders, broadcastOrderUpdate };

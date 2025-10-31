import { createServer } from "http";
import { WebSocketServer } from "ws";
import { handleConnection } from "./lib/connection";
import { env } from "./config/env";

const PORT = env.PORT || process.env.PORT || 4000;
const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
  } else {
    res.writeHead(404);
    res.end();
  }
});
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", handleConnection);

server.listen(PORT, () => {
  console.log(`✅ Umati WS server running on port ${PORT}`);
});

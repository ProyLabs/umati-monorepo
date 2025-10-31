import { createServer } from "http";
import { WebSocketServer } from "ws";
import { handleConnection } from "./lib/connection";
import { env } from "./config/env";

const server = createServer();
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", handleConnection);

server.listen(env.PORT, () => {
  console.log(`✅ Umati WS server running on port ${env.PORT}`);
});

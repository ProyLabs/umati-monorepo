import { createServer } from "http";
import next from "next";
import os from "os";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = Number(process.env.PORT) || 3000;

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "localhost";
}

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));
  const host = dev ? "0.0.0.0" : "localhost";
  const ip = dev ? getLocalIp() : "localhost";

  server.listen(PORT, host, () => {
    console.log(`> Next.js server ready on http://${ip}:${PORT}`);
    if (dev) console.log(`> WS server expected on ws://${ip}:4000`);
  });
});

import app from './app.js'
import { env } from "./config/env.js";
import { connectDatabase , gracefulShutdown} from "./database/connection.js";
import http from "http";
import  {initSocketServer} from "./realtime/socket.server.js"

async function startServer() {
  await connectDatabase(env.mongoUri);

  const server = http.createServer(app);
  initSocketServer(server);

  gracefulShutdown(server) ;

  server.listen(env.port, () => {
  console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}\nhttp://localhost:${env.port}`);
});

}

startServer();

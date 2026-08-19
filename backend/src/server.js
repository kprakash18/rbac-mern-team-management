import app from './app.js'
import { env } from "./config/env.js";
import { connectDatabase , gracefulShutdown} from "./database/connection.js";

// const app = express();

async function startServer() {
  await connectDatabase(env.mongoUri);

  const server = app.listen(env.port, () => {
    console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}\nhttp://localhost:${env.port}`);
  });

  gracefulShutdown(server) ;
}

startServer();

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();


const requiredVariables = [
  "MONGO_URI",
  "JWT_SECRET",
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 8000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  redisUrl: process.env.REDIS_URL,
  upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL,
  brevoApiKey: process.env.BREVO_API_KEY,
  emailFrom: process.env.EMAIL_FROM || "Team Management <codezenith007@gmail.com>",
  senderEmail: process.env.SENDER_EMAIL || "codezenith007@gmail.com",
};


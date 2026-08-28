import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openApiDocument = YAML.load(path.join(__dirname, "openapi.yaml"));

export const swaggerDocs = {
  serve: swaggerUi.serve,
  setup: (req, res, next) => {
    const document = YAML.load(path.join(__dirname, "openapi.yaml"));
    return swaggerUi.setup(document, {
      customSiteTitle: "Team Management & RBAC API Docs",
      swaggerOptions: {
        persistAuthorization: true, // Remembers your JWT token on browser reload
      },
    })(req, res, next);
  },
};

export default swaggerDocs;

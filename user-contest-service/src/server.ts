import "reflect-metadata";
import { AppDataSource } from "./config/db";
import app from "./app";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "../src/docs/swagger";

const PORT = process.env.PORT || 4000;

AppDataSource.initialize()
  .then(() => {
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      withCredentials: true,
    },
  })
);


    app.listen(PORT, () => {
      console.log(`✅ DB Connected`);
      console.log(`🚀 User-Contest Service running on port ${PORT}`);
      console.log(`📘 Swagger Docs available at: http://localhost:${PORT}/api/docs`);
      console.log(`💓 Health Check: http://localhost:${PORT}/health`);
    });
  })
  .catch((err) => {
    console.error("❌ Data Source initialization error:", err);
    process.exit(1);
  });

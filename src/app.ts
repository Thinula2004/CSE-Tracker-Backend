import express from "express";
import cors from "cors";

import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

import authRoutes from "./routes/authRoutes";
import companyRoutes from "./routes/companyRoutes";
import marketPriceRoutes from "./routes/marketPriceRoutes";
import shareRoutes from "./routes/shareRoutes";
import transactionRoutes from "./routes/transactionRoutes";

const app = express();

app.use(cors());
app.use(express.json());

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "CSE Tracker API",
            version: "1.0.0",
            description: "API documentation",
        },
    },
    apis: ["./src/routes/*.ts"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/market", marketPriceRoutes);
app.use("/api/share", shareRoutes);
app.use("/api/transaction", transactionRoutes);

export default app;
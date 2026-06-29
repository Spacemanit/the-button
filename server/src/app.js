import express from "express";
import cors from "cors";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import pressRoutes from "./routes/press.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/press", pressRoutes);

export default app;
import express from "express";
import cors from "cors";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import pressRoutes from "./routes/press.routes.js";

const app = express();

app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    "http://localhost:5173"
  ],
  credentials: true
}));
app.use(express.json());

// test route — delete later
app.get("/", (req, res) => {
  res.json({ message: "Server is alive" });
});

app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/press", pressRoutes);

export default app;
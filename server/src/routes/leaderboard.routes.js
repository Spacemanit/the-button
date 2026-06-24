import express from "express";
import { getLeaderboard } from "../controllers/leaderboard.controller.js";

const router = express.Router();

router.get('/', async (req, res) => {
    const data = await getLeaderboard();
    res.status(201).json(data);
});

export default router;
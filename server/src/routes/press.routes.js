import express from "express";
import { getTotalPresses, getTimeSinceLastPress } from "../controllers/press.controller.js";

const router = express.Router();

router.get('/state', (req, res) => {
  const data = { totalPresses: getTotalPresses, timeSinceLastPress: getTimeSinceLastPress };
  res.status(201).json(data);
})

export default router;
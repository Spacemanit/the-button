import express from "express";
import { getTotalPresses, getTimeSinceLastPress, getState } from "../controllers/press.controller.js";

const router = express.Router();

router.get('/state', async (req, res) => {
  const alreadyPressed = await getState(req.query.username);
  res.status(200).json({
    totalPresses: getTotalPresses(),
    timeSinceLastPress: getTimeSinceLastPress(),
    alreadyPressed
  });
});

export default router;
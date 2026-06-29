import express from "express";
import { getTotalPresses, getTimeSinceLastPress, getState } from "../controllers/press.controller.js";

const router = express.Router();

router.get('/state', async (req, res) => {
  const data = { totalPresses: getTotalPresses, timeSinceLastPress: getTimeSinceLastPress };
  const bool = await getState(req.query.username);
  console.log(bool)
  if (bool) {
    console.log('Already Pressed!', req.query.username);
    res.status(100).json(data);
  } else {
    res.status(201).json(data);
  }
});

export default router;
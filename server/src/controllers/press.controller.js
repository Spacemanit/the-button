import User from "../models/user.model.js";
import getTier from "../utils/tier.js";
import { EventEmitter } from "events";

export const pressEmitter = new EventEmitter();

let lastPressTime = Date.now();
let totalPresses = 0;

export const initPressState = async () => {
  totalPresses = await User.countDocuments();
  const lastPress = await User.findOne().sort({ pressedAt: -1 });
  if (lastPress) lastPressTime = lastPress.pressedAt.getTime();
};

export const handlePress = async (username) => {
  const existing = await User.findOne({ username });

  const now = Date.now();
  const waitTime = Math.floor((now - lastPressTime) / 1000);
  const colorTier = getTier(waitTime);

  await User.create({ username, waitTime, colorTier });

  lastPressTime = now;
  totalPresses += 1;
  pressEmitter.emit("reset");

  return { username, waitSeconds: waitTime, colorTier, totalPresses };
};

export const getState = async (username) => {
  const existing = await User.findOne({ username });
  if (existing) {
    return true;
  }
  return false;
}

export const getTotalPresses  = () => totalPresses;
export const getTimeSinceLastPress = () => Math.floor((Date.now() - lastPressTime) / 1000);
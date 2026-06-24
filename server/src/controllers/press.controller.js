import Press from "../models/press.model.js";
import User from "../models/user.model.js";
import getTier from "../utils/tier.js";
import { EventEmitter } from "events";

export const pressEmitter = new EventEmitter();

let lastPressTime = Date.now();
let totalPresses = 0;

export const initPressState = async () => {
  totalPresses = await Press.countDocuments();
  const lastPress = await Press.findOne().sort({ pressedAt: -1 });
  if (lastPress) lastPressTime = lastPress.pressedAt.getTime();
};

export const handlePress = async (username, countdown) => {
  const now = Date.now();
  const waitSeconds = 60-countdown;
  const colorTier = getTier(waitSeconds);

  let user = await User.findOne({ username });
  if (!user) {
    user = await User.create({ username });
  } else if (user.totalPresses == 1) {
    throw new Error("User already pressed the button");
  }

  const press = await Press.create({
    userId: user._id,
    username,
    waitTime: waitSeconds,
    colorTier
  });

  user.totalPresses = 1;
  user.longestWait = waitSeconds;
  user.colorTier = colorTier;
  await user.save();

  lastPressTime = now;
  totalPresses += 1;
  pressEmitter.emit('reset');

  return {
    username,
    waitSeconds,
    colorTier,
    totalPresses,
    pressedAt: press.pressedAt
  };
};

export const getTimeSinceLastPress = () => {
  return Math.floor((Date.now() - lastPressTime) / 1000);
};

export const getTotalPresses = () => totalPresses;
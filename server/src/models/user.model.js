import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  waitTime: { type: Number, required: true },
  colorTier: { type: String, required: true },
  pressedAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
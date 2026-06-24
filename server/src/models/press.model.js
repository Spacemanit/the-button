import mongoose from "mongoose";

const pressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  username: {
    type: String,
    required: true
  },
  waitTime: {
    type: Number,  // seconds they waited before pressing
    required: true
  },
  colorTier: {
    type: String,  // purple, blue, green, yellow, orange, red
    required: true
  },
  pressedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Press", pressSchema);
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  longestWait: {
    type: Number,  // stored in seconds
    default: 0
  },
  colorTier: { 
    type: String,
    default: "red"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("User", userSchema);
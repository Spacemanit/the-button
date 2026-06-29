import User from "../models/user.model.js";

export const getLeaderboard = async () => {
  return await User.find()
    .sort({ waitTime: -1 })
    .limit(10)
    .select("username waitTime colorTier -_id");
};
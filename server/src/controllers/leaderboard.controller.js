import User from "../models/user.model.js";

export const getLeaderboard = async() => {
    return await User.find().sort({ longestWait: -1 }).limit(10).select("username totalPresses longestWait -_id");
};
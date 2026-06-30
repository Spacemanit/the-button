import { Server } from "socket.io";
import {
  handlePress,
  getTotalPresses,
  initPressState,
  pressEmitter
} from "../controllers/press.controller.js";
import { getLeaderboard } from "../controllers/leaderboard.controller.js";

let activeUsers = 0;
let totalUsers = 0;
let countdown = 60; // global timer
let countdownInterval = null;

const startCountdown = (io) => {
  if (countdownInterval) clearInterval(countdownInterval);

  countdown = 60;

  countdownInterval = setInterval(() => {
    countdown--;
    io.emit("timer", countdown);

    if (countdown <= 0) {
      countdown=60;
      io.emit("timer", countdown);
    }
  }, 1000);
};

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // reset timer whenever a press happens
  pressEmitter.on("reset", () => {
    startCountdown(io);
  });

  // start timer on server boot
  startCountdown(io);

  io.on("connection", (socket) => {
    activeUsers++;
    totalUsers++;

    // send current countdown immediately on connect
    socket.emit("init", {
      totalPresses: getTotalPresses(),
      activeUsers,
      totalUsers,
      timer: countdown // ← send current timer value, not time since last press
    });

    io.emit("activeUsers", activeUsers);
    io.emit("totalUsers", totalUsers);

    socket.on("press", async (username) => {
      try {
        const result = await handlePress(username, countdown);
        const leaderboard = await getLeaderboard();

        io.emit("pressed", { ...result, activeUsers });
        io.emit("leaderboard", leaderboard);
      } catch (err) {
        socket.emit("pressError", { message: err.message });
      }
    });

    socket.on("disconnect", () => {
      activeUsers--;
      io.emit("activeUsers", activeUsers);
    });
  });
};

export default initSocket;
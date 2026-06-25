import dotenv from "dotenv";
import "dotenv/config";
import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import initSocket from "./sockets/index.js";
import { initPressState } from "./controllers/press.controller.js";

dotenv.config();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

initSocket(server);

connectDB().then(async () => {
  await initPressState();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

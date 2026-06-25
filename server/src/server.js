import "dotenv/config";
import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import initSocket from "./sockets/index.js";
import { initPressState } from "./controllers/press.controller.js";

console.log('Testing purpose');
const PORT = process.env.PORT;
const server = http.createServer(app);

console.log(PORT)
console.log(process.env.MONGOURI);

initSocket(server);

connectDB().then(async () => {
  await initPressState();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

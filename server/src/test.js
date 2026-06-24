import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected to server");
  
  // simulate a press
  socket.emit("press", "testuser");
});

socket.on("init", (data) => {
  console.log("Initial state:", data);
});

socket.on("pressed", (data) => {
  console.log("Press result:", data);
  socket.disconnect();
  process.exit(0);
});

socket.on("pressError", (err) => {
  console.error("Error:", err);
  process.exit(1);
});
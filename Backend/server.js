import "dotenv/config";
import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import projectModel from "./models/project.model.js";
import { generateResult } from "./services/ai.service.js";

const PORT = process.env.PORT || 3000;

// ✅ Connect to MongoDB before starting server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // Exit so Render knows deployment failed
  });

const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*" } });

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.split(" ")[1];

    const projectId = socket.handshake.query.projectId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error("Invalid projectId"));
    }

    socket.project = await projectModel.findById(projectId);
    if (!socket.project) return next(new Error("Project not found"));

    if (!token) return next(new Error("Authentication error"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;

    next();
  } catch (error) {
    console.error("❌ Socket auth error:", error);
    next(error);
  }
});

io.on("connection", (socket) => {
  socket.roomId = socket.project._id.toString();
  console.log("✅ User connected:", socket.user.email);

  socket.join(socket.roomId);

  socket.on("project-message", async (data) => {
    const { message } = data;
    socket.broadcast.to(socket.roomId).emit("project-message", data);

    if (message.includes("@ai")) {
      const prompt = message.replace("@ai", "").trim();
      try {
        const result = await generateResult(prompt);
        io.to(socket.roomId).emit("project-message", {
          sender: { _id: "ai", email: "Gemini AI" },
          message: JSON.stringify(result),
        });
      } catch (err) {
        console.error("❌ AI generation error:", err);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.user?.email || "Unknown");
    socket.leave(socket.roomId);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

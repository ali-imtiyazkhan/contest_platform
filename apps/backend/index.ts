import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import IORedis from "ioredis";

import "./lib/redis";
import express from "express";
import userRouter from "./routes/user";
import contestRouter from "./routes/contest";
import adminRouter from "./routes/admin";
import teamRouter from "./routes/team";
import duelRouter from "./routes/duel";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { client } from "db/client";
import passport from "passport";
import authRouter from "./routes/auth";

dotenv.config();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3005",
  "https://100xcontest-red.vercel.app"
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const app = express();
const server = createServer(app);

export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Redis adapter setup
const redisOptions = process.env.REDIS_URL
  ? process.env.REDIS_URL
  : {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    };

const pubClient = new IORedis(redisOptions as any, {
  maxRetriesPerRequest: null,
});

pubClient.on("error", (err) => {
  console.error("Socket.IO Redis PubClient Error:", err);
});

const subClient = pubClient.duplicate();

subClient.on("error", (err) => {
  console.error("Socket.IO Redis SubClient Error:", err);
});

if (process.env.NODE_ENV === "production" || process.env.REDIS_HOST || process.env.REDIS_URL) {
  io.adapter(createAdapter(pubClient, subClient));
}

// Socket connection logic
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId: string) => {
    socket.join(userId);
    console.log(`User ${userId} joined their private room`);
  });

  // Chat logic
  socket.on("chat:join", (contestId: string) => {
    socket.join(`contest:${contestId}`);
    console.log(`Socket ${socket.id} joined contest chat: ${contestId}`);
  });

  socket.on("chat:send", async (data: { contestId: string, userId: string, content: string }) => {
    try {
      const message = await client.chatMessage.create({
        data: {
          content: data.content,
          userId: data.userId,
          contestId: data.contestId
        },
        include: {
          user: {
            select: { displayName: true, email: true, avatarColor: true }
          }
        }
      });

      io.to(`contest:${data.contestId}`).emit("chat:message", {
        id: message.id,
        content: message.content,
        userId: message.userId,
        userName: message.user.displayName || message.user.email.split("@")[0],
        avatarColor: message.user.avatarColor,
        timestamp: message.createdAt
      });
    } catch (e) {
      console.error("Chat message error:", e);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.text());
app.use(passport.initialize());

app.get("/health", (req, res) => {
  res.json({ message: "Health Check!" });
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/contest", contestRouter);
app.use("/api/v1/team", teamRouter);
app.use("/api/v1/duel", duelRouter);

const port = process.env.PORT || 4000;

server.listen(port, () => {
  console.log(` Server running at http://localhost:${port}`);
});

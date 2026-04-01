import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import multer from "multer";
import connectDB from "./config/db.js";
import KuppiPost from "./models/KuppiPost.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import notesRoutes from "./routes/notesRoutes.js";
import kuppiRoutes from "./routes/kuppiRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import studyPilotRoutes from "./routes/studyPilotRoutes.js";
import meetupRoutes from "./routes/meetupRoutes.js";
import timetableRoutes from "./routes/timetableRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { startMeetupCancellationJob } from "./jobs/meetupJobs.js";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];

const corsOriginHandler = (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error("Not allowed by CORS"));
  }
};

// Middleware
app.use(
  cors({
    origin: corsOriginHandler,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// API Routes
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart Campus Companion API",
    version: "1.0.0",
  });
});

// Registering Routes
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    server: "ok",
    database: "connected",
    environment: process.env.NODE_ENV || "development",
  });
});

// Block DB-backed API routes until DB is connected (dev-friendly)
app.use("/api", (req, res, next) => {
  if (req.path === "/health") return next();
  if (app.locals.dbConnected) return next();
  const payload = {
    success: false,
    message: "Database not connected. Check /api/health for details.",
  };
  if ((process.env.NODE_ENV || "development") !== "production" && app.locals.dbError) {
    payload.dbError = app.locals.dbError;
  }
  return res.status(503).json(payload);
});

// API Routes (require DB)
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api", messageRoutes);
app.use("/api", fileRoutes);
app.use("/api", notesRoutes);
app.use("/api", kuppiRoutes);
app.use("/api", notificationRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/study-pilot', studyPilotRoutes);
app.use("/api", meetupRoutes);
app.use("/api", timetableRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 50MB",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Socket.io — same origin policy as Express (works with multiple dev ports)
const io = new Server(server, {
  cors: {
    origin: corsOriginHandler,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle user joining their personal room
  socket.on("join-room", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined personal room`);
  });

  // Handle user joining a group
  socket.on("join-group", (groupId) => {
    socket.join(`group-${groupId}`);
    console.log(`User joined group: ${groupId}`);
  });

  // Handle user leaving a group
  socket.on("leave-group", (groupId) => {
    socket.leave(`group-${groupId}`);
    console.log(`User left group: ${groupId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Make io accessible in routes
app.set("io", io);

const startJobs = async () => {
  const archiveExpiredKuppiPostsJob = async () => {
    try {
      const now = new Date();
      const result = await KuppiPost.updateMany(
        {
          isArchived: false,
          eventDate: { $lt: now },
        },
        {
          $set: {
            isArchived: true,
            archivedAt: now,
            archivedReason: "event-expired",
          },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`Archived ${result.modifiedCount} expired kuppi posts`);
      }
    } catch (error) {
      console.error("Kuppi expiry job error:", error.message);
    }
  };

  await archiveExpiredKuppiPostsJob();
  setInterval(archiveExpiredKuppiPostsJob, 60 * 1000);

  startMeetupCancellationJob();
};

/**
 * Same lifecycle as `main`: connect MongoDB first, then listen (no API without DB).
 */
const startServer = async () => {
  try {
    await connectDB();

    await startJobs();

    const PORT = process.env.PORT || 5000;
    server
      .listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      })
      .on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.error(
            `Port ${PORT} is already in use. Kill the other process or change PORT in .env`
          );
        } else {
          console.error("Server error:", err.message);
        }
        process.exit(1);
      });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;
server
  .listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Kill the other process or change PORT in .env`);
    } else {
      console.error("Server error:", err.message);
    }
    process.exit(1);
  });

// Connect DB in background (and start DB-backed jobs when ready)
initDb();

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let memoryServer = null;

/** "remote" = real MONGO_URI; "memory" = mongodb-memory-server (data lost on restart) */
export let dbConnectionMode = "none";

const toSafeMongoUriForLogs = (mongoUri) => {
  if (!mongoUri) return "";
  try {
    const u = new URL(mongoUri);
    // Keep only protocol + host + path; drop credentials and query.
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    // Fallback: redact credentials if present.
    return mongoUri.replace(/\/\/[^@]+@/i, "//***:***@");
  }
};

/**
 * In-memory MongoDB is opt-in only. Silent fallback hid Atlas/network issues and made
 * users think data was "not saving" (it was only in RAM until the process exited).
 * Set USE_IN_MEMORY_DB=true in backend/.env if you need to work fully offline.
 */
const shouldFallbackToInMemoryDb = () => process.env.USE_IN_MEMORY_DB === "true";

/**
 * Same pattern as `main`: connect to Atlas (or any Mongo URI) — no local/in-memory DB.
 */
const connectDB = async () => {
  let mongoUri = (process.env.MONGO_URI || process.env.MONGODB_URI || "").trim();

  if (!mongoUri) {
    throw new Error("MongoDB URI is missing. Set MONGO_URI or MONGODB_URI in your environment.");
  }

  // Common .env mistake: MONGO_URI=MONGO_URI=mongodb+srv://...
  if (mongoUri.startsWith("MONGO_URI=")) {
    mongoUri = mongoUri.slice("MONGO_URI=".length).trim();
  }
  if (!mongoUri.startsWith("mongodb://") && !mongoUri.startsWith("mongodb+srv://")) {
    throw new Error(
      "MONGO_URI must start with mongodb:// or mongodb+srv://. Check backend/.env for a typo (e.g. duplicate MONGO_URI=)."
    );
  }

  const connect = async (uri) => {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout instead of hanging
      connectTimeoutMS: 10000,
    });
    return conn;
  };

  try {
    const conn = await connect(mongoUri);
    dbConnectionMode = "remote";
    console.log(`MongoDB Connected (persistent): ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("  MongoDB Connection FAILED");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("  Error:", error.message);
    console.error("  Fix checklist:");
    console.error("  1. Go to MongoDB Atlas → Network Access");
    console.error("     Add your current IP address (or 0.0.0.0/0 for dev)");
    console.error("  2. Check your MONGO_URI credentials in backend/.env");
    console.error("     Current URI (redacted):", toSafeMongoUriForLogs(mongoUri));
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (shouldFallbackToInMemoryDb()) {
      try {
        console.warn("Falling back to an in-memory MongoDB for local development.");
        if (!memoryServer) {
          memoryServer = await MongoMemoryServer.create({
            instance: { dbName: "scc-dev" },
          });
        }
        const memUri = memoryServer.getUri();
        const conn = await connect(memUri);
        dbConnectionMode = "memory";
        console.warn(
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
            "  IN-MEMORY MongoDB (USE_IN_MEMORY_DB=true)\n" +
            "  Data is NOT written to Atlas — it is lost when this process stops.\n" +
            "  For persistence: fix MONGO_URI + Atlas Network Access, then set\n" +
            "  USE_IN_MEMORY_DB=false or remove it from backend/.env.\n" +
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        );
        console.log(`In-memory MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (memErr) {
        throw new Error(
          `MongoDB connection failed: ${error.message}; in-memory fallback also failed: ${memErr?.message || memErr}`
        );
      }
    }

    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
};

export default connectDB;

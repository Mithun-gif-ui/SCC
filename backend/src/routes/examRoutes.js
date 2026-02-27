import express from "express";
import { 
    createExam, 
    getExams, 
    generatePlan, 
    uploadNote, 
    getAiSummary 
} from "../controllers/examController.js";

// Oyage existing upload file eka methanata import karanna
import upload from "../middlewares/upload.js"; 

const router = express.Router();

// Mock Auth Middleware - (Oya Phase 1 eke hadapu JWT protect middleware eka real eke use karanna)
const protect = (req, res, next) => {
    // Testing walata dummy user id ekak assign karanawa
    req.user = { id: "65f1a2b3c4d5e6f7a8b9c0d1" }; 
    next();
};

// Exam CRUD
router.post("/", protect, createExam);
router.get("/", protect, getExams);

// AI Timetable Generation
router.post("/generate-plan", protect, generatePlan);

// File Upload & AI Summary
// Methanadi upload.single("file") use karanne oyage upload.js eka haraha file eka handle karanna
router.post("/upload-note", protect, upload.single("file"), uploadNote);
router.post("/ai-summary", protect, getAiSummary);

export default router;
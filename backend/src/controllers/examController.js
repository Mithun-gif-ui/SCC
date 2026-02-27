import Exam from "../models/Exam.js";
import StudyPlan from "../models/StudyPlan.js";
import UploadedNote from "../models/UploadedNote.js";
import { generateStudyRoadmap, generateNotesSummary } from "../services/aiService.js";
import fs from "fs";
import pdfParse from "pdf-parse";

// 1. Create a new Exam
export const createExam = async (req, res) => {
    try {
        const { subject, examDate, syllabusTopics, difficulty } = req.body;
        const newExam = new Exam({
            userId: req.user.id, // req.user.id comes from auth middleware
            subject,
            examDate,
            syllabusTopics,
            difficulty
        });
        const savedExam = await newExam.save();
        res.status(201).json(savedExam);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Get all Exams for the logged-in user
export const getExams = async (req, res) => {
    try {
        const exams = await Exam.find({ userId: req.user.id }).sort({ examDate: 1 });
        res.status(200).json(exams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Generate AI Study Plan based on the Exam
export const generatePlan = async (req, res) => {
    try {
        const { examId, availableHoursPerDay } = req.body;
        
        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ message: "Exam not found" });

        const today = new Date();
        const examDate = new Date(exam.examDate);
        const daysRemaining = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));

        if (daysRemaining <= 0) return res.status(400).json({ message: "Exam date has passed!" });

        // Call AI Service
        const generatedPlan = await generateStudyRoadmap(
            exam.subject,
            exam.syllabusTopics,
            exam.difficulty,
            daysRemaining,
            availableHoursPerDay
        );

        const newStudyPlan = new StudyPlan({
            userId: req.user.id,
            examId: exam._id,
            subject: exam.subject,
            generatedPlan,
            startDate: today,
            endDate: examDate
        });

        await newStudyPlan.save();
        res.status(201).json(newStudyPlan);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. Upload Document & Extract Text
export const uploadNote = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Please upload a file" });

        const filePath = req.file.path;
        let extractedText = "Text extraction not supported for this file type yet.";

        // Handle PDF text extraction
        if (req.file.mimetype === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            extractedText = data.text;
        } else if (req.file.mimetype === 'text/plain') {
            extractedText = fs.readFileSync(filePath, 'utf-8');
        }

        const newNote = new UploadedNote({
            userId: req.user.id,
            fileUrl: filePath,
            extractedText: extractedText.trim()
        });

        await newNote.save();
        res.status(201).json({ message: "File processed successfully", noteId: newNote._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. Generate AI Summary for the uploaded Note
export const getAiSummary = async (req, res) => {
    try {
        const { noteId } = req.body;
        
        const note = await UploadedNote.findById(noteId);
        if (!note) return res.status(404).json({ message: "Note not found" });

        const aiResponse = await generateNotesSummary(note.extractedText);
        
        res.status(200).json(aiResponse);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
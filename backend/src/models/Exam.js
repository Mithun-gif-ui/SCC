import mongoose from "mongoose";

const examSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    subject: { 
        type: String, 
        required: true 
    },
    examDate: { 
        type: Date, 
        required: true 
    },
    syllabusTopics: [{ 
        type: String 
    }],
    difficulty: { 
        type: String, 
        enum: ['easy', 'medium', 'hard'], 
        default: 'medium' 
    },
}, { timestamps: true });

export default mongoose.model('Exam', examSchema);
import mongoose from "mongoose";

const uploadedNoteSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    fileUrl: { 
        type: String, 
        required: true 
    }, // Upload wena path eka
    extractedText: { 
        type: String, 
        required: true 
    }, // AI ekata danna kalin extract karaganna text eka
    textChunks: [{ 
        type: String 
    }] // Optional (Passe semantic search add karoth)
}, { timestamps: true });

export default mongoose.model('UploadedNote', uploadedNoteSchema);
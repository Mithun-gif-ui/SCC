import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Timetable AI Generator
export const generateStudyRoadmap = async (subject, topics, difficulty, daysRemaining, hoursPerDay) => {
    const prompt = `Create a structured daily study plan for the subject '${subject}'. 
    Topics to cover: ${topics.join(', ')}. 
    Difficulty: ${difficulty}. 
    Days remaining: ${daysRemaining}. 
    Daily study hours available: ${hoursPerDay} hours.
    Provide the output ONLY as a valid JSON array of objects with keys: day (number), topic (string), duration (number in hours), focus (string).`;

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content);
};

// Summary & Flashcards Generator
export const generateNotesSummary = async (extractedText) => {
    // Limit text size to save API tokens
    const prompt = `Analyze the following text and generate a study guide. 
    Provide the output ONLY as a JSON object with two keys: 
    'summary' (a string explaining core concepts), 
    'flashcards' (an array of objects with 'question' and 'answer' keys).
    Text: ${extractedText.substring(0, 3000)}`;

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
    });

    return JSON.parse(response.choices[0].message.content);
};
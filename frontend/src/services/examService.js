import api from './api';

const examService = {
  createExam: async (examData) => {
    const response = await api.post('/api/exams', examData);
    return response.data;
  },

  getExams: async () => {
    const response = await api.get('/api/exams');
    return response.data;
  },

  generatePlan: async (examId, availableHoursPerDay) => {
    const response = await api.post('/api/exams/generate-plan', { examId, availableHoursPerDay });
    return response.data;
  },

  uploadNote: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/exams/upload-note', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getAiSummary: async (noteId) => {
    const response = await api.post('/api/exams/ai-summary', { noteId });
    return response.data;
  }
};

export default examService;
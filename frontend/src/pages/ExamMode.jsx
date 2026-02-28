import React, { useState, useEffect } from 'react';
import examService from '../services/examService';
import ExamDashboard from '../components/exam/ExamDashboard';
import AIPlanner from '../components/exam/AIPlanner';
import SmartNotes from '../components/exam/SmartNotes';
import '../styles/ExamMode.css';

const ExamMode = () => {
  const [activeTab, setActiveTab] = useState('exams');
  const [exams, setExams] = useState([]);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const data = await examService.getExams();
      setExams(data);
    } catch (error) {
      console.error("Error fetching exams:", error);
    }
  };

  return (
    <div className="exam-mode-container">
      <h1 className="exam-header">🎯 AI Exam Assistant</h1>
      
      <div className="exam-tabs">
        <button 
          className={`exam-tab-btn ${activeTab === 'exams' ? 'active' : ''}`} 
          onClick={() => setActiveTab('exams')}
        >
          My Exams
        </button>
        <button 
          className={`exam-tab-btn ${activeTab === 'planner' ? 'active' : ''}`} 
          onClick={() => setActiveTab('planner')}
        >
          AI Timetable
        </button>
        <button 
          className={`exam-tab-btn ${activeTab === 'notes' ? 'active' : ''}`} 
          onClick={() => setActiveTab('notes')}
        >
          Smart Notes
        </button>
      </div>

      <div className="exam-content">
        {activeTab === 'exams' && <ExamDashboard exams={exams} fetchExams={fetchExams} />}
        {activeTab === 'planner' && <AIPlanner exams={exams} />}
        {activeTab === 'notes' && <SmartNotes />}
      </div>
    </div>
  );
};

export default ExamMode;
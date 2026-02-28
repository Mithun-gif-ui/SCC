import React, { useState } from 'react';
import examService from '../../services/examService';

const ExamDashboard = ({ exams, fetchExams }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ subject: '', examDate: '', topics: '', difficulty: 'medium' });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const topicsArray = formData.topics.split(',').map(t => t.trim());
      await examService.createExam({ ...formData, syllabusTopics: topicsArray });
      setFormData({ subject: '', examDate: '', topics: '', difficulty: 'medium' });
      fetchExams();
    } catch (error) {
      alert("Failed to create exam");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      <div className="exam-card">
        <h3 style={{ marginBottom: '20px', color: '#fff' }}>➕ Add New Exam</h3>
        <form onSubmit={handleSubmit}>
          <input className="exam-input" type="text" name="subject" placeholder="Subject Name" value={formData.subject} onChange={handleChange} required />
          <input className="exam-input" type="date" name="examDate" value={formData.examDate} onChange={handleChange} required />
          <input className="exam-input" type="text" name="topics" placeholder="Topics (e.g. Agile, Scrum)" value={formData.topics} onChange={handleChange} required />
          <select className="exam-select" name="difficulty" value={formData.difficulty} onChange={handleChange}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button className="exam-btn" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create Target'}</button>
        </form>
      </div>

      <div className="exam-card">
        <h3 style={{ marginBottom: '20px', color: '#fff' }}>📅 Upcoming Exams</h3>
        {exams.length === 0 ? <p style={{ color: '#94a3b8' }}>No exams scheduled yet.</p> : null}
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {exams.map(exam => (
            <div key={exam._id} className="exam-list-item">
              <div>
                <h4 style={{ margin: 0, color: '#fff' }}>{exam.subject}</h4>
                <small style={{ color: '#94a3b8' }}>Topics: {exam.syllabusTopics.length}</small>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#00d2ff', fontWeight: 'bold' }}>
                  {new Date(exam.examDate).toLocaleDateString('en-GB')}
                </div>
                <span style={{ fontSize: '0.8rem', background: '#334155', padding: '2px 8px', borderRadius: '12px' }}>
                  {exam.difficulty.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamDashboard;
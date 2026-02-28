import React, { useState } from 'react';
import examService from '../../services/examService';

const AIPlanner = ({ exams }) => {
  const [selectedExam, setSelectedExam] = useState('');
  const [hours, setHours] = useState(4);
  const [studyPlan, setStudyPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!selectedExam) return alert("Select an exam first!");
    setLoading(true);
    try {
      const data = await examService.generatePlan(selectedExam, hours);
      setStudyPlan(data.generatedPlan);
    } catch (error) {
      alert("AI Generation failed. Check days remaining.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="exam-card">
      <h3 style={{ marginBottom: '20px' }}>🧠 Smart Study Roadmap</h3>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <select className="exam-select" value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} style={{ marginBottom: 0 }}>
          <option value="">-- Select Target Exam --</option>
          {exams.map(ex => <option key={ex._id} value={ex._id}>{ex.subject}</option>)}
        </select>
        <input className="exam-input" type="number" value={hours} onChange={(e) => setHours(e.target.value)} min="1" max="12" placeholder="Hrs/Day" style={{ width: '120px', marginBottom: 0 }} />
        <button className="exam-btn" onClick={handleGenerate} disabled={loading || !selectedExam} style={{ width: 'auto' }}>
          {loading ? 'Analyzing...' : 'Generate Plan'}
        </button>
      </div>

      {studyPlan && (
        <div style={{ background: '#020617', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <h4 style={{ color: '#00d2ff', marginBottom: '16px' }}>Your Personalized AI Schedule</h4>
          {studyPlan.map((day, idx) => (
            <div key={idx} className="exam-list-item" style={{ borderLeftColor: '#10b981' }}>
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ color: '#fff' }}>Day {day.day}: {day.topic}</strong>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>⏱️ {day.duration} Hrs</span>
                </div>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>{day.focus}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIPlanner;
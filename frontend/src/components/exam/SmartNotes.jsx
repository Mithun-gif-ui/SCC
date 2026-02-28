import React, { useState } from 'react';
import examService from '../../services/examService';

const SmartNotes = () => {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a PDF!");
    setLoading(true);
    try {
      const uploadRes = await examService.uploadNote(file);
      const summaryRes = await examService.getAiSummary(uploadRes.noteId);
      setSummary(summaryRes);
    } catch (error) {
      alert("Failed to process document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="exam-card">
      <h3 style={{ marginBottom: '20px' }}>📄 Upload Notes for AI Analysis</h3>
      
      <form onSubmit={handleUpload} style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '30px' }}>
        <input 
          type="file" 
          accept="application/pdf" 
          onChange={(e) => setFile(e.target.files[0])} 
          className="exam-input" 
          style={{ marginBottom: 0, padding: '8px' }}
        />
        <button type="submit" className="exam-btn" disabled={loading || !file} style={{ width: 'auto' }}>
          {loading ? 'Extracting Text & Thinking...' : 'Summarize Document'}
        </button>
      </form>

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ background: '#020617', padding: '20px', borderRadius: '12px' }}>
            <h4 style={{ color: '#00d2ff', marginBottom: '16px' }}>📝 Core Summary</h4>
            <p style={{ lineHeight: '1.6', color: '#cbd5e1' }}>{summary.summary}</p>
          </div>
          
          <div>
            <h4 style={{ color: '#10b981', marginBottom: '16px' }}>🧠 Flashcards</h4>
            <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
              {summary.flashcards?.map((card, idx) => (
                <div key={idx} className="flashcard">
                  <div className="flashcard-q">Q: {card.question}</div>
                  <div className="flashcard-a">A: {card.answer}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartNotes;
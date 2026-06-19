'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Search, FileText, Send, User, ChevronRight, MessageSquare, Users } from 'lucide-react';

export default function FacultyReviewsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResume, setSelectedResume] = useState<any>(null);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Initial fetch of students
    handleSearch('');
  }, []);

  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/faculty/students?search=${query}`);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectStudent = async (student: any) => {
    setSelectedStudent(student);
    setSelectedResume(null);
    setResumes([]);
    try {
      const res = await api.get(`/faculty/students/${student.id}/resumes`);
      setResumes(res.data);
      if (res.data.length > 0) {
        setSelectedResume(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitReview = async () => {
    if (!reviewText.trim() || !selectedResume) return;
    setSubmitting(true);
    try {
      await api.post(`/faculty/review/${selectedResume.id}`, { comments: reviewText });
      setReviewText('');
      alert('Review sent successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to send review. Minimum 10 characters required.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex h-[calc(100vh-8rem)] gap-6">
      
      {/* Left Sidebar: Student Search */}
      <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800 mb-3">Find Students</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or roll..."
              className="w-full pl-10 pr-4 py-2 border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>
          ) : students.length > 0 ? (
            students.map((student) => (
              <button 
                key={student.id}
                onClick={() => selectStudent(student)}
                className={`w-full text-left p-3 rounded-xl mb-1 flex items-center justify-between transition-colors ${
                  selectedStudent?.id === student.id ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    selectedStudent?.id === student.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${selectedStudent?.id === student.id ? 'text-blue-900' : 'text-slate-900'}`}>{student.name}</p>
                    <p className="text-xs text-slate-500">{student.roll_number} • {student.department}</p>
                  </div>
                </div>
                <ChevronRight size={16} className={selectedStudent?.id === student.id ? 'text-blue-500' : 'text-slate-300'} />
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
              <User size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">No students found</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Content: Resume View & Review */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        {selectedStudent ? (
          <>
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedStudent.name}</h2>
                <p className="text-sm text-slate-500">{selectedStudent.department} • CGPA: {selectedStudent.cgpa}</p>
              </div>
              {resumes.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">Select Resume:</span>
                  <select 
                    className="border-slate-200 rounded-lg text-sm bg-white"
                    onChange={(e) => setSelectedResume(resumes.find(r => r.id === parseInt(e.target.value)))}
                    value={selectedResume?.id || ''}
                  >
                    {resumes.map(r => (
                      <option key={r.id} value={r.id}>{r.file_name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex-1 p-6 flex flex-col">
              {resumes.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <FileText size={48} className="mb-4 opacity-20" />
                  <p>This student hasn't uploaded any resumes yet.</p>
                </div>
              ) : selectedResume ? (
                <div className="flex-1 flex flex-col space-y-4">
                  <div className="bg-slate-100 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="text-blue-600" />
                      <div>
                        <p className="font-semibold text-slate-800">{selectedResume.file_name}</p>
                        <p className="text-xs text-slate-500">ATS Score: {selectedResume.score?.ats_score?.toFixed(1) || 'N/A'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        try {
                          const res = await api.get(`/resumes/download/${selectedResume.id}`, { responseType: 'blob' });
                          const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                          window.open(url, '_blank');
                          setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                        } catch(e) {
                          alert("Failed to securely fetch the file.");
                        }
                      }}
                      className="text-sm text-blue-600 font-medium hover:underline"
                    >
                      View Original File
                    </button>
                  </div>

                  <div className="flex-1 border border-slate-200 rounded-xl p-4 flex flex-col bg-slate-50">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <MessageSquare size={16} /> Send Review
                    </h3>
                    <textarea 
                      className="flex-1 w-full border-slate-200 rounded-lg p-3 text-sm resize-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Write your feedback here... (Minimum 10 characters)"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                    ></textarea>
                    <div className="mt-3 flex justify-end">
                      <button 
                        onClick={submitReview}
                        disabled={submitting || reviewText.length < 10}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                      >
                        {submitting ? 'Sending...' : 'Send Review'}
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <Users size={64} className="mb-4 opacity-10" />
            <h3 className="text-xl font-bold text-slate-600 mb-2">Select a Student</h3>
            <p className="max-w-md">Search and select a student from the left panel to view their resumes and leave feedback.</p>
          </div>
        )}
      </div>

    </div>
  );
}

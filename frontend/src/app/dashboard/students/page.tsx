"use client";

import { useState, useEffect } from "react";
import { 
  Users, Search, Filter, GraduationCap, ChevronRight, CheckCircle, 
  Send, Sparkles, Star, Calendar, Info, BookOpen, ExternalLink, MapPin
} from "lucide-react";
import toast from "react-hot-toast";

interface MockStudent {
  id: number;
  name: string;
  roll: string;
  dept: string;
  cgpa: number;
  ats: number;
  skills: string[];
  type: string;
  match: number;
}

export default function StudentsDirectoryPreview() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [cgpaFilter, setCgpaFilter] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<MockStudent | null>(null);
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("waitlist_students")) setIsWaitlisted(true);
    if (localStorage.getItem("feedback_students")) setIsSubmitted(true);
  }, []);

  const students: MockStudent[] = [
    { id: 1, name: "Arjun Sharma", roll: "21BCE1001", dept: "CSE", cgpa: 8.5, ats: 78, skills: ["Python", "React", "SQL", "Git", "FastAPI"], type: "SDE", match: 88 },
    { id: 2, name: "Priya Nair", roll: "RA2011003", dept: "ECE", cgpa: 7.9, ats: 65, skills: ["C++", "Matlab", "Python", "Linux", "Verilog"], type: "General", match: 72 },
    { id: 3, name: "Rohit Sen", roll: "22BDS0402", dept: "CSE", cgpa: 9.1, ats: 86, skills: ["Python", "TensorFlow", "Pandas", "PyTorch", "SQL"], type: "Data Science", match: 94 },
    { id: 4, name: "Meera Joshi", roll: "RA2011245", dept: "ME", cgpa: 8.2, ats: 72, skills: ["MATLAB", "CAD", "Python", "Ansys", "SolidWorks"], type: "General", match: 58 }
  ];

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.roll.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !deptFilter || s.dept === deptFilter;
    const matchesCgpa = s.cgpa >= cgpaFilter;
    return matchesSearch && matchesDept && matchesCgpa;
  });

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Enter a valid email address.");
      return;
    }
    localStorage.setItem("waitlist_students", email);
    setIsWaitlisted(true);
    toast.success("Successfully registered for the Recruiter Hub waitlist!");
  };

  const handleFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast.error("Feedback cannot be empty.");
      return;
    }
    localStorage.setItem("feedback_students", feedback);
    setIsSubmitted(true);
    toast.success("Feedback submitted!");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-900 to-indigo-950 text-white p-8 md:p-12 shadow-xl border border-indigo-950">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 w-72 h-72 bg-indigo-500 rounded-full opacity-10 blur-3xl" />
        
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-xs font-semibold text-purple-300">
            <Sparkles className="w-3.5 h-3.5" /> Recruiter Portal Preview — Coming Soon
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Student Portfolio & <span className="text-purple-400">Talent Sourcing Directory</span>
          </h1>
          <p className="text-indigo-200 text-sm md:text-base leading-relaxed">
            Allow hiring partners, college admins, and faculty to explore student portfolios, filter by tech stacks or CGPA, inspect resume analysis scorecards, and invite students to direct recruitment pipelines.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-indigo-300 font-medium">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-purple-400" /> Planned Release: Q4 2026</span>
            <span className="w-1.5 h-1.5 bg-indigo-700 rounded-full" />
            <span className="flex items-center gap-1.5"><Info className="w-4 h-4 text-purple-400" /> Target Users: Recruiters & Placement Cells</span>
          </div>
        </div>
      </div>

      {/* Directory Interface Mockup */}
      <div className="card border border-indigo-100 shadow-md">
        <div className="space-y-4 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Candidate Search Console
            </h2>
            <p className="text-xs text-gray-400">Interactive Directory Preview — Test the search & filter triggers</p>
          </div>

          {/* Interactive Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or roll number..."
                className="input pl-9"
              />
            </div>
            <select 
              value={deptFilter} 
              onChange={(e) => setDeptFilter(e.target.value)}
              className="input w-40"
            >
              <option value="">All Departments</option>
              <option value="CSE">Computer Science (CSE)</option>
              <option value="ECE">Electronics (ECE)</option>
              <option value="ME">Mechanical (ME)</option>
            </select>
            <select 
              value={cgpaFilter} 
              onChange={(e) => setCgpaFilter(parseFloat(e.target.value))}
              className="input w-36"
            >
              <option value="0">All CGPA</option>
              <option value="8.0">CGPA 8.0+</option>
              <option value="9.0">CGPA 9.0+</option>
            </select>
          </div>
        </div>

        {/* Student Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <div 
                key={student.id} 
                onClick={() => setSelectedStudent(student)}
                className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 hover:border-indigo-300 hover:bg-white transition-all cursor-pointer shadow-sm hover:shadow group relative"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{student.name}</h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        {student.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">Roll: {student.roll} • Dept: {student.dept}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      {student.match}% Match
                    </span>
                    <p className="text-[9px] text-gray-400 mt-1">Amazon SDE criteria</p>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {student.skills.map((s) => (
                    <span key={s} className="text-[9px] font-medium bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                      {s}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs font-semibold text-indigo-600">
                  <span className="flex items-center gap-1">ATS Score: <strong className="text-gray-950">{student.ats}</strong></span>
                  <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    Inspect Portfolio <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-12 text-gray-400 text-sm">
              No students match the selected filter criteria.
            </div>
          )}
        </div>
      </div>

      {/* Modal Mockup Detail */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-950">{selectedStudent.name}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                    {selectedStudent.type}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Dept: {selectedStudent.dept} • Roll Number: {selectedStudent.roll}</p>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Simulated Heatmap */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500" /> Resume Component Heatmap
              </h4>
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                {[
                  { label: "Impact Score", pct: selectedStudent.ats - 4, color: "bg-brand-500" },
                  { label: "Skills Check", pct: selectedStudent.ats + 6, color: "bg-emerald-500" },
                  { label: "Structure", pct: 95, color: "bg-green-500" },
                  { label: "ATS Compatibility", pct: 85, color: "bg-amber-500" }
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="font-semibold text-gray-700">{item.pct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-500" /> Highlighted Projects
              </h4>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                  <p className="font-bold text-gray-800 flex items-center justify-between">
                    SaaS Placement Readiness Engine <ExternalLink className="w-3 h-3 text-indigo-500" />
                  </p>
                  <p className="text-[10px] mt-0.5 text-gray-400 font-medium">React • FastAPI • spaCy NLP</p>
                  <ul className="list-disc pl-4 mt-2 space-y-1 text-gray-500">
                    <li>Built parsing pipelines extracting structured bullets from PDF.</li>
                    <li>Designed score modules with active voice check resulting in 30% improvement.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  toast.success(`Invite sent to ${selectedStudent.name}!`);
                  setSelectedStudent(null);
                }}
                className="btn-primary flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                Invite to Direct Pipeline
              </button>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forms Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recruiter Waitlist */}
        <div className="card h-full flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" /> Recruiter Beta Access
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Are you a placement coordinator or hiring manager? Join the waitlist to receive access to the live student database search.
            </p>
          </div>

          <div className="mt-6">
            {isWaitlisted ? (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-4 text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                <h4 className="font-bold text-sm">Waitlist Confirmed</h4>
                <p className="text-xs text-green-600">
                  We'll contact you at <strong>{localStorage.getItem("waitlist_students") || email}</strong> when invite tokens release.
                </p>
              </div>
            ) : (
              <form onSubmit={handleWaitlist} className="space-y-3">
                <div>
                  <label className="label">Recruitment / Work Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="recruiter@techcompany.com"
                    className="input"
                  />
                </div>
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                  Request Directory Access Token <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Feature Request */}
        <div className="card h-full flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" /> Directory Feature Request
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Want specific search filters, portfolio layout tweaks, or direct email automation? Tell us what recruiters look for.
            </p>
          </div>

          <div className="mt-6">
            {isSubmitted ? (
              <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-2xl p-4 text-center space-y-2">
                <Sparkles className="w-8 h-8 text-indigo-500 mx-auto" />
                <h4 className="font-bold text-sm">Request Submitted</h4>
                <p className="text-xs text-indigo-600">
                  Your feature request has been delivered to the student portfolio engineering team.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFeedback} className="space-y-3">
                <div>
                  <label className="label">Your Request</label>
                  <textarea 
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="e.g. It would be amazing to filter students by minimum graduation year or directly download a batch of candidate PDFs..."
                    className="input resize-none py-2"
                  />
                </div>
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 bg-indigo-900 hover:bg-indigo-950">
                  Submit Request <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


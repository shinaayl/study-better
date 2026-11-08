import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Database, BookOpen, Layers, Plus, Trash2, Loader2, Sparkles, Filter, Search, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function KnowledgeBaseManager({ courses, onCoursesUpdated, setSelectedCourse, setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploadError, setUploadError] = useState('');

  // Upload Form State
  const [file, setFile] = useState(null);
  const [department, setDepartment] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [level, setLevel] = useState('300');
  const [semester, setSemester] = useState('First Semester');
  const [session, setSession] = useState('2023/2024');
  const [documentType, setDocumentType] = useState('past_examination_paper');

  // Filter state
  const [deptFilter, setDeptFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([api.getStats(), api.getDocuments()])
      .then(([statsData, docsData]) => {
        setStats(statsData);
        setDocuments(docsData.documents || []);
      })
      .catch((err) => console.error('Failed to load KB data:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);

      // Auto-populate course code from filename if matches
      const match = selected.name.match(/([A-Za-z]{2,5})\s*(\d{3,4})/);
      if (match && !courseCode) {
        setCourseCode(`${match[1].toUpperCase()} ${match[2]}`);
      }

      if (selected.name.toLowerCase().includes('marking') || selected.name.toLowerCase().includes('ms')) {
        setDocumentType('marking_scheme');
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a document file (.docx, .doc, .pdf, .txt, or .md)');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    if (department.trim()) formData.append('department', department.trim());
    if (courseCode.trim()) formData.append('course_code', courseCode.trim().toUpperCase());
    if (courseTitle.trim()) formData.append('course_title', courseTitle.trim());
    if (level) formData.append('level', level);
    if (semester) formData.append('semester', semester);
    if (session.trim()) formData.append('session', session.trim());
    if (documentType) formData.append('document_type', documentType);

    try {
      const res = await api.uploadDocument(formData);
      setUploadSuccess(res.ingestion_stats);
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('kb-file-input');
      if (fileInput) fileInput.value = '';

      loadData();
      if (onCoursesUpdated) {
        api.getCourses().then((cRes) => onCoursesUpdated(cRes.courses || []));
      }
    } catch (err) {
      setUploadError(err.message || 'Failed to upload and ingest document');
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesDept = !deptFilter || (doc.department && doc.department.toLowerCase() === deptFilter.toLowerCase());
    const matchesSearch = !searchQuery || 
      (doc.course_code && doc.course_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.source_filename && doc.source_filename.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.course_title && doc.course_title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDept && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Institutional Knowledge Base & Document Ingestion</h2>
              <p className="text-xs text-slate-300">
                Universal multi-department framework: upload historic past questions, lecture materials, and marking guides for any faculty.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1.5 rounded-full border border-emerald-500/30 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Vector Grounding Ready
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Departments</span>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total_departments}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Courses</span>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total_courses}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Ingested Files</span>
            <p className="text-2xl font-bold text-sky-600 mt-1">{stats.total_documents}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Past Questions</span>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.total_questions}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Marking Steps</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.total_criteria}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Upload Dropzone & Document Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Admin & Lecturer Ingestion Portal</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Designed for lecturers and departmental administrators across all faculties. Upload examination papers, official marking schemes, and lecture materials (.docx, .doc, .pdf, .txt, .md). The RAG pipeline indexes questions, criteria, and vector embeddings so students receive strictly grounded answers without hallucinations.
            </p>

            {uploadSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs space-y-1">
                <div className="flex items-center font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                  Successfully Ingested {uploadSuccess.course_code}!
                </div>
                <div className="text-[11px] text-emerald-700">
                  Ingested {uploadSuccess.questions_count} questions, {uploadSuccess.criteria_count} marking steps, and {uploadSuccess.chunks_count} vector chunks.
                </div>
                <div className="pt-1">
                  <button
                    onClick={() => {
                      if (setSelectedCourse) setSelectedCourse(uploadSuccess.course_code);
                      if (setActiveTab) setActiveTab('chat');
                    }}
                    className="text-xs font-bold text-indigo-700 hover:underline flex items-center"
                  >
                    Ask questions for {uploadSuccess.course_code} now <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              {/* File Drop Area */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Document File (.docx, .doc, .pdf, .txt, .md)
                </label>
                <input
                  id="kb-file-input"
                  type="file"
                  accept=".docx,.doc,.pdf,.txt,.md"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-300 rounded-xl p-2 bg-slate-50"
                  required
                />
              </div>

              {/* Department & Course Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Economics, Law, CSC"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Course Code</label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="e.g. ECO 101, LAW 201"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Course Title */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Course Title</label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g. Introduction to Macroeconomics"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Level, Semester & Academic Session */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-2 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="100">100L</option>
                    <option value="200">200L</option>
                    <option value="300">300L</option>
                    <option value="400">400L</option>
                    <option value="500">500L</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-2 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="First Semester">First</option>
                    <option value="Second Semester">Second</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Session</label>
                  <input
                    type="text"
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    placeholder="2023/2024"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-2 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Document Type */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Document Classification</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                >
                  <option value="past_examination_paper">Official Past Examination Paper</option>
                  <option value="marking_scheme">Official Departmental Marking Scheme</option>
                  <option value="lecture_notes">Lecture Notes / Slide Transcripts</option>
                  <option value="syllabus_guide">Departmental Syllabus & Exam Guide</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Parsing & Ingesting Vectors...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload & Ingest into Knowledge Base</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Ingested Documents Catalog */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Ingested Documents Archive</h3>
                <p className="text-xs text-slate-500">
                  {filteredDocs.length} documents currently indexing {stats ? stats.total_questions : '...'} questions.
                </p>
              </div>

              {/* Search & Department Filters */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search docs or course..."
                    className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none w-40 sm:w-48"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="text-xs text-slate-500">Loading documents...</span>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-xs font-semibold text-slate-600">No documents found matching your filter</p>
                <p className="text-[11px] text-slate-400">Upload past questions or lecture notes to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Course</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Document</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Session</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.document_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-indigo-700 whitespace-nowrap">
                          {doc.course_code}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {doc.department || 'Computer Science'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 font-medium max-w-xs truncate" title={doc.source_filename}>
                          {doc.source_filename}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            doc.document_type === 'marking_scheme'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}>
                            {doc.document_type === 'marking_scheme' ? 'Marking Guide' : 'Exam Paper'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {doc.academic_year}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

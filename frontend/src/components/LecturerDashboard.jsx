import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, FileText, CheckCircle2, AlertCircle, Database, BookOpen, 
  Layers, Plus, Trash2, Loader2, Sparkles, Filter, Search, ArrowRight, 
  CheckSquare, Award, BarChart3, HelpCircle, Eye, ShieldCheck, UserCheck, RefreshCw, X,
  Star, Flag, ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';

export default function LecturerDashboard({
  currentUser,
  courses,
  onCoursesUpdated,
  selectedCourse,
  setSelectedCourse
}) {
  const [activeSubTab, setActiveSubTab] = useState('wizard'); // 'wizard', 'catalog', 'calibrate', 'cohort'
  const [stats, setStats] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Upload Wizard Form State
  const [file, setFile] = useState(null);
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [level, setLevel] = useState('300');
  const [semester, setSemester] = useState('First Semester');
  const [session, setSession] = useState('2023/2024');
  const [documentType, setDocumentType] = useState('past_examination_paper'); // 'past_examination_paper', 'marking_scheme', 'lecture_notes', 'syllabus_guide'
  const [isDragging, setIsDragging] = useState(false);

  // Course Management & Creation State
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    course_code: '',
    course_title: '',
    department: currentUser?.department || 'Computer Science',
    level: 300,
    semester: 'First Semester',
    credit_units: 3
  });
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [courseCreateSuccess, setCourseCreateSuccess] = useState('');
  const [courseCreateError, setCourseCreateError] = useState('');
  const [selectedExistingCourse, setSelectedExistingCourse] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploadError, setUploadError] = useState('');

  // Document Inspection & Delete State
  const [inspectingDoc, setInspectingDoc] = useState(null);
  const [docChunksData, setDocChunksData] = useState(null);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [activeInspectTab, setActiveInspectTab] = useState('chunks'); // 'chunks' | 'questions'

  // Calibration Simulator State
  const [calibCourse, setCalibCourse] = useState(selectedCourse || (courses[0]?.course_code || 'CSC 321'));
  const [calibQuestions, setCalibQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [selectedQuestionData, setSelectedQuestionData] = useState(null);
  const [studentAnswerInput, setStudentAnswerInput] = useState('');
  const [calibrating, setCalibrating] = useState(false);
  const [calibResult, setCalibResult] = useState(null);

  // Filter state for catalog
  const [catalogCourseFilter, setCatalogCourseFilter] = useState('');

  // Quality Control & Lecturer Feedback Loop State
  const [guardrailMetrics, setGuardrailMetrics] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [guardrailLogs, setGuardrailLogs] = useState([]);
  const [loadingQuality, setLoadingQuality] = useState(false);
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('all');
  const [feedbackCourseFilter, setFeedbackCourseFilter] = useState('');
  const [selectedFeedbackForCalib, setSelectedFeedbackForCalib] = useState(null);
  const [calibCorrectedText, setCalibCorrectedText] = useState('');
  const [calibratingFeedback, setCalibratingFeedback] = useState(false);
  const [calibFeedbackSuccess, setCalibFeedbackSuccess] = useState('');

  const loadQualityData = () => {
    setLoadingQuality(true);
    Promise.all([
      api.getGuardrailMetrics(),
      api.getFeedbackList({
        course_code: feedbackCourseFilter || undefined,
        status: feedbackStatusFilter !== 'all' ? feedbackStatusFilter : undefined,
        limit: 30
      }),
      api.getGuardrailLogs({
        course_code: feedbackCourseFilter || undefined,
        limit: 30
      })
    ])
      .then(([metricsData, feedbackData, logsData]) => {
        setGuardrailMetrics(metricsData);
        setFeedbackList(feedbackData.feedback || []);
        setGuardrailLogs(logsData.logs || []);
      })
      .catch((err) => console.error('Failed to load quality control data:', err))
      .finally(() => setLoadingQuality(false));
  };

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

  useEffect(() => {
    if (activeSubTab === 'quality') {
      loadQualityData();
    }
  }, [activeSubTab, feedbackStatusFilter, feedbackCourseFilter]);

  const handleOpenCalibrateModal = (fb) => {
    setSelectedFeedbackForCalib(fb);
    setCalibCorrectedText(fb.corrected_answer || '');
    setCalibFeedbackSuccess('');
  };

  const handleExecuteCalibration = async () => {
    if (!selectedFeedbackForCalib || !calibCorrectedText.trim()) return;
    setCalibratingFeedback(true);
    try {
      await api.calibrateFeedback(selectedFeedbackForCalib.feedback_id, {
        corrected_answer: calibCorrectedText.trim(),
        lecturer_name: currentUser?.name || 'Department Lecturer',
        lecturer_email: currentUser?.email || 'lecturer@ui.edu.ng'
      });
      setCalibFeedbackSuccess('Solution calibrated and indexed into knowledge base vector store!');
      setTimeout(() => {
        setSelectedFeedbackForCalib(null);
        setCalibFeedbackSuccess('');
        loadQualityData();
      }, 1500);
    } catch (err) {
      console.error('Calibration error:', err);
      alert('Calibration error: ' + err.message);
    } finally {
      setCalibratingFeedback(false);
    }
  };

  useEffect(() => {
    if (calibCourse) {
      api.getCourseQuestions(calibCourse)
        .then((res) => {
          setCalibQuestions(res.questions || []);
          if (res.questions && res.questions.length > 0) {
            setSelectedQuestionId(res.questions[0].question_id);
          }
        })
        .catch((err) => console.error('Failed to load calib questions:', err));
    }
  }, [calibCourse]);

  useEffect(() => {
    if (selectedQuestionId) {
      api.getQuestionDetails(selectedQuestionId)
        .then((res) => {
          setSelectedQuestionData(res);
          // Set a default sample answer for quick testing
          if (res.marking_scheme && res.marking_scheme.length > 0) {
            setStudentAnswerInput(`In ${calibCourse}, the system operates by allocating resources in fixed partitions. Each memory partition has a static predefined size determined at system initialization. However, when a process requests memory smaller than the partition size, internal fragmentation occurs because the leftover space within that partition cannot be assigned to another process.`);
          }
        })
        .catch((err) => console.error('Failed to load question details:', err));
    }
  }, [selectedQuestionId]);

  const handleInspectChunks = async (doc) => {
    setInspectingDoc(doc);
    setLoadingChunks(true);
    setDocChunksData(null);
    try {
      const data = await api.getDocumentChunks(doc.document_id);
      setDocChunksData(data);
    } catch (err) {
      console.error('Failed to load chunks', err);
    } finally {
      setLoadingChunks(false);
    }
  };

  const handleDeleteDocument = async (docId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}" and purge its vector embeddings from ChromaDB?`)) {
      return;
    }
    try {
      await api.deleteDocument(docId);
      loadData();
      if (onCoursesUpdated) {
        api.getCourses().then((cRes) => onCoursesUpdated(cRes.courses || []));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete document');
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => { setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);

      // Auto-detect course code from filename if present
      const match = selected.name.match(/([A-Za-z]{2,5})[\s_-]*(\d{2,4}[A-Za-z]?)/i);
      if (match && !courseCode) {
        setCourseCode(`${match[1].toUpperCase()} ${match[2].toUpperCase()}`);
      } else if (!courseCode) {
        const fallback = selectedExistingCourse || selectedCourse || (courses && courses[0]?.course_code) || '';
        if (fallback) setCourseCode(fallback);
      }

      // Auto-detect marking scheme in filename
      const fname = selected.name.toLowerCase();
      if (fname.includes('marking') || fname.includes('rubric') || fname.includes('ms')) {
        setDocumentType('marking_scheme');
      } else if (fname.includes('note') || fname.includes('slide') || fname.includes('handout')) {
        setDocumentType('lecture_notes');
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

    const effectiveCode = (courseCode.trim() || selectedExistingCourse || selectedCourse || (courses && courses[0]?.course_code) || 'CSC 321').toUpperCase();
    const effectiveDept = (department.trim() || currentUser?.department || 'Computer Science').trim();
    const effectiveTitle = (courseTitle.trim() || `${effectiveCode} Academic Course Material`).trim();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('course_code', effectiveCode);
    formData.append('department', effectiveDept);
    formData.append('course_title', effectiveTitle);
    if (level) formData.append('level', level);
    if (semester) formData.append('semester', semester);
    if (session.trim()) {
      formData.append('session', session.trim());
      formData.append('year', session.trim());
    }
    if (documentType) {
      formData.append('document_type', documentType);
      formData.append('doc_type', documentType);
    }

    try {
      const res = await api.uploadDocument(formData);
      setUploadSuccess(res.ingestion_stats);
      setFile(null);
      const fileInput = document.getElementById('lecturer-file-input');
      if (fileInput) fileInput.value = '';

      loadData();
      if (onCoursesUpdated) {
        api.getCourses().then((cRes) => onCoursesUpdated(cRes.courses || []));
      }
    } catch (err) {
      const msg = err.message || 'Failed to upload and ingest document';
      if (msg.includes('403') || msg.toLowerCase().includes('access denied') || msg.toLowerCase().includes('student')) {
        setUploadError('Access Denied: Only lecturers/examiners can upload materials. Please switch to Lecturer Mode using the role toggle in the top bar.');
      } else {
        setUploadError(msg);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSelectExistingCourse = (code) => {
    setSelectedExistingCourse(code);
    if (!code) return;
    const found = courses.find((c) => c.course_code === code);
    if (found) {
      setCourseCode(found.course_code);
      setCourseTitle(found.course_title || '');
      setDepartment(found.department || currentUser?.department || '');
      if (found.level) setLevel(String(found.level));
      if (found.semester) setSemester(found.semester);
    }
  };

  const handleCreateCourseSubmit = async (e) => {
    e.preventDefault();
    if (!newCourse.course_code.trim() || !newCourse.course_title.trim()) {
      setCourseCreateError('Course code and course title are required.');
      return;
    }
    setCreatingCourse(true);
    setCourseCreateError('');
    setCourseCreateSuccess('');
    try {
      await api.createCourse({
        course_code: newCourse.course_code.trim().toUpperCase(),
        course_title: newCourse.course_title.trim(),
        department: (newCourse.department || currentUser?.department || 'General Studies').trim(),
        level: parseInt(newCourse.level, 10),
        semester: newCourse.semester,
        credit_units: parseInt(newCourse.credit_units, 10)
      });
      setCourseCreateSuccess(`Course ${newCourse.course_code.toUpperCase()} created successfully!`);
      const cRes = await api.getCourses();
      if (onCoursesUpdated) {
        onCoursesUpdated(cRes.courses || []);
      }
      setCourseCode(newCourse.course_code.trim().toUpperCase());
      setCourseTitle(newCourse.course_title.trim());
      setDepartment(newCourse.department.trim());
      setLevel(String(newCourse.level));
      setSemester(newCourse.semester);
      setSelectedExistingCourse(newCourse.course_code.trim().toUpperCase());
      setNewCourse({
        course_code: '',
        course_title: '',
        department: currentUser?.department || 'Computer Science',
        level: 300,
        semester: 'First Semester',
        credit_units: 3
      });
      setTimeout(() => {
        setIsCreateCourseOpen(false);
        setCourseCreateSuccess('');
      }, 1200);
    } catch (err) {
      setCourseCreateError(err.message || 'Failed to create course');
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleDeleteCourse = async (code) => {
    if (!window.confirm(`Are you sure you want to delete course ${code} and all its documents?`)) {
      return;
    }
    try {
      await api.deleteCourse(code);
      const cRes = await api.getCourses();
      if (onCoursesUpdated) {
        onCoursesUpdated(cRes.courses || []);
      }
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete course');
    }
  };

  const handleRunCalibration = async () => {
    if (!selectedQuestionId || !studentAnswerInput.trim()) return;
    setCalibrating(true);
    setCalibResult(null);

    try {
      const result = await api.submitEvaluation({
        question_id: selectedQuestionId,
        student_id: 'lecturer-calibration-preview',
        student_answer: studentAnswerInput.trim()
      });
      setCalibResult(result);
    } catch (err) {
      console.error('Calibration failed', err);
    } finally {
      setCalibrating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
      {/* Lecturer Identity Banner */}
      <div className="bg-white text-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-purple-200/90">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-purple-100 text-purple-900 font-semibold text-[10px] px-2.5 py-0.5 rounded-full border border-purple-200 uppercase tracking-wider">
                  Faculty Studio · Continuous AI Learning
                </span>
                <span className="text-purple-300 text-xs">·</span>
                <span className="text-purple-800 text-xs font-mono">{currentUser?.department || 'Computer Science'}</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight mt-1 text-slate-900">
                {currentUser?.name || 'Academic Course Examiner'}
              </h1>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Initial materials in the repository are baseline test data. Upload your official past examination papers, syllabus modules, and marking schemes below. The AI agent immediately indexes and prioritizes your data for all future student revisions.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsCreateCourseOpen(true)}
              className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-purple-700/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Course</span>
            </button>
            <button
              onClick={loadData}
              className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl px-4 py-2 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-purple-700" />
              <span>Refresh Catalog</span>
            </button>
          </div>
        </div>

        {/* Aggregate Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-purple-100 text-xs">
            <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200/80">
              <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider block">Indexed Courses</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{stats.total_courses || 0}</span>
            </div>
            <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200/80">
              <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider block">Past Questions</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{stats.total_questions || 0}</span>
            </div>
            <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200/80">
              <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider block">Marking Rubrics</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{stats.total_criteria || 0}</span>
            </div>
            <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200/80">
              <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider block">Ingested Documents</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{stats.total_documents || 0}</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-purple-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('wizard')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'wizard'
              ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
              : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Syllabus & Papers</span>
        </button>

        <button
          onClick={() => setActiveSubTab('courses')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'courses'
              ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
              : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Course Catalog ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'catalog'
              ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
              : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Ingested Documents & Chunks</span>
        </button>

        <button
          onClick={() => setActiveSubTab('calibrate')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'calibrate'
              ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
              : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Rubric Simulator</span>
        </button>

        <button
          onClick={() => setActiveSubTab('quality')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'quality'
              ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
              : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Model Calibration & Feedback</span>
        </button>
      </div>

      {/* SUB-TAB 1: UPLOAD & INGESTION WIZARD */}
      {activeSubTab === 'wizard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Step-by-Step Guided Upload */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center">
                  <UploadCloud className="w-5 h-5 mr-2 text-indigo-600" />
                  3-Step Course Material & Exam Paper Ingestion
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Upload your departmental examination papers, marking guides, or lecture notes. The AI Study Agent extracts questions, criteria, and generates vector embeddings automatically.
                </p>
              </div>

              {uploadSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex items-center font-bold text-emerald-950 text-sm">
                    <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600" />
                    Successfully Ingested {uploadSuccess.course_code}!
                  </div>
                  <p className="text-emerald-700">
                    The document was parsed into <strong>{uploadSuccess.questions_count} past questions</strong>, <strong>{uploadSuccess.criteria_count} marking steps</strong>, and <strong>{uploadSuccess.chunks_count} dense vector chunks</strong>.
                  </p>
                  <div className="pt-2 flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setCalibCourse(uploadSuccess.course_code);
                        setActiveSubTab('calibrate');
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center space-x-1"
                    >
                      <span>Test Marking Scheme Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setActiveSubTab('catalog')}
                      className="text-emerald-800 hover:underline font-semibold text-xs"
                    >
                      View in Catalog
                    </button>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {/* Step 1: Course Info */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white inline-flex items-center justify-center text-[10px] mr-1.5 font-mono">1</span>
                    Step 1: Course Identification
                  </span>

                  {courses && courses.length > 0 && (
                    <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-indigo-950 flex items-center">
                          <Database className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                          Select Course (Auto-fills metadata)
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCreateCourseOpen(true)}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                        >
                          + New Course
                        </button>
                      </div>
                      <select
                        value={selectedExistingCourse}
                        onChange={(e) => handleSelectExistingCourse(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      >
                        <option value="">-- Choose an existing course to auto-fill or enter manually below --</option>
                        {courses.map((c) => (
                          <option key={c.course_id} value={c.course_code}>
                            {c.course_code} - {c.course_title} ({c.department})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">Department</label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Economics, Law, Engineering, Medicine, Computer Science"
                        className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">Course Code</label>
                      <input
                        type="text"
                        value={courseCode}
                        onChange={(e) => setCourseCode(e.target.value)}
                        placeholder="e.g. CSC 321, ECO 101, LAW 201 (or auto-detected from file)"
                        className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono font-bold text-purple-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Course Title</label>
                    <input
                      type="text"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      placeholder="e.g. Operating Systems Architecture"
                      className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">Level</label>
                      <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-2 py-2 focus:outline-none"
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
                        className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-2 py-2 focus:outline-none"
                      >
                        <option value="First Semester">First</option>
                        <option value="Second Semester">Second</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">Academic Session</label>
                      <input
                        type="text"
                        value={session}
                        onChange={(e) => setSession(e.target.value)}
                        placeholder="2023/2024"
                        className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-2 py-2 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 2: Document Purpose */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white inline-flex items-center justify-center text-[10px] mr-1.5 font-mono">2</span>
                    Step 2: Document Purpose Classification
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setDocumentType('past_examination_paper')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        documentType === 'past_examination_paper'
                          ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 font-bold shadow-sm ring-1 ring-indigo-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 mb-1">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span>Past Exam Paper</span>
                      </div>
                      <p className="text-[11px] font-normal text-slate-500">
                        Contains exam questions, sections & allotted marks.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDocumentType('marking_scheme')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        documentType === 'marking_scheme'
                          ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 font-bold shadow-sm ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 mb-1">
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                        <span>Official Marking Scheme</span>
                      </div>
                      <p className="text-[11px] font-normal text-slate-500">
                        Contains criteria steps, keywords & full mark expectations.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDocumentType('lecture_notes')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        documentType === 'lecture_notes'
                          ? 'border-sky-600 bg-sky-50/90 text-sky-950 font-bold shadow-sm ring-1 ring-sky-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 mb-1">
                        <BookOpen className="w-4 h-4 text-sky-600" />
                        <span>Lecture Notes & Slides</span>
                      </div>
                      <p className="text-[11px] font-normal text-slate-500">
                        Course handouts and slide transcripts for concept grounding.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDocumentType('syllabus_guide')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        documentType === 'syllabus_guide'
                          ? 'border-purple-600 bg-purple-50/90 text-purple-950 font-bold shadow-sm ring-1 ring-purple-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 mb-1">
                        <Award className="w-4 h-4 text-purple-600" />
                        <span>Syllabus & Exam Guide</span>
                      </div>
                      <p className="text-[11px] font-normal text-slate-500">
                        Official curriculum and topic learning outcomes.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Step 3: File Upload */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white inline-flex items-center justify-center text-[10px] mr-1.5 font-mono">3</span>
                    Step 3: Document Upload & Vector Ingestion
                  </span>

                  {/* Drag-and-Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('lecturer-file-input').click()}
                    className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-indigo-600 bg-indigo-50/70 scale-[0.99]'
                        : file
                        ? 'border-emerald-500 bg-emerald-50/30'
                        : 'border-slate-300 hover:border-indigo-400 bg-white'
                    }`}
                  >
                    <input
                      id="lecturer-file-input"
                      type="file"
                      accept=".docx,.doc,.pdf,.txt,.md"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        file ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {file ? <CheckCircle2 className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
                      </div>

                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          {file ? file.name : "Drag and drop your syllabus or exam file here, or click to browse"}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Supports Word (.docx, .doc), PDF (.pdf), Text (.txt, .md) up to 50MB
                        </span>
                      </div>

                      {file && (
                        <div className="flex items-center space-x-2 pt-1">
                          <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Click to change file
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chunking & Embedding Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                    <span className="flex items-center font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 mr-1.5 shrink-0" />
                      Chunk Size: <strong className="ml-1 text-slate-800">800 tokens</strong> · Overlap: <strong className="ml-1 text-slate-800">150 tokens</strong>
                    </span>
                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border border-indigo-200 shrink-0 inline-flex items-center">
                      <Database className="w-3 h-3 mr-1 text-indigo-600" />
                      text-embedding-004 (768-dim)
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-2xl text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Extracting Questions, Criteria & Generating Vectors...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Ingest into Departmental Knowledge Base</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Workflow Explainer & Quick Guidance */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <HelpCircle className="w-4 h-4 mr-1.5 text-indigo-600" />
                How the Ingestion Engine Works
              </h3>
              
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <span className="font-bold text-indigo-900 block mb-0.5">1. Past Exam Paper Extraction</span>
                  <p>When you upload past examination papers, the parser identifies each question number (e.g. Question 1a, 1b), all marks allotted, and categorizes the topic tag.</p>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="font-bold text-emerald-900 block mb-0.5">2. Departmental Marking Scheme Mapping</span>
                  <p>When you upload your official marking guide, the engine links criteria steps directly to past questions. Students submitting answers will be graded against these exact examiner expectations.</p>
                </div>

                <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100">
                  <span className="font-bold text-sky-900 block mb-0.5">3. Dense Vector Embeddings (ChromaDB)</span>
                  <p>Document text is chunked and embedded using dense vector similarity models, shielding the agent from hallucinations and grounding every explanation in departmental literature.</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setActiveSubTab('calibrate')}
                  className="w-full text-indigo-700 bg-indigo-50 hover:bg-indigo-100 py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Open Calibration Simulator</span>
                </button>
              </div>
            </div>

            {/* Ingestion Status Summary Card */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-5 shadow-sm space-y-2">
              <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Anti-Hallucination Policy Active</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Students inquiring about courses not yet uploaded will receive a clear notice stating materials are unavailable, preventing inaccurate answers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: COURSE MANAGEMENT & CREATION */}
      {activeSubTab === 'courses' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <Database className="w-5 h-5 mr-2 text-indigo-600" />
                Departmental Course Directory ({courses.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Create and manage academic courses (e.g. MTH 201 - Linear Algebra), monitor syllabus materials, and upload exam papers.
              </p>
            </div>
            <button
              onClick={() => setIsCreateCourseOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create New Course</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Quick Add Course Card */}
            <div
              onClick={() => setIsCreateCourseOpen(true)}
              className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[170px] space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 group-hover:scale-110 flex items-center justify-center transition-all">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800">Create New Course</span>
              <p className="text-[11px] text-slate-400 max-w-[200px]">
                Register a course like "MTH 201 - Linear Algebra"
              </p>
            </div>

            {/* Existing Course Cards */}
            {courses.map((c) => {
              const docCount = documents.filter((d) => d.course_code === c.course_code).length;
              return (
                <div key={c.course_id} className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="font-mono font-bold text-indigo-700 text-sm bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                        {c.course_code}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                        {c.level ? `${c.level}L` : '300L'} · {c.credit_units || 3} Units
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{c.course_title}</h3>
                      <p className="text-[11px] text-slate-500">{c.department} · {c.semester}</p>
                    </div>

                    <div className="pt-2 flex items-center space-x-3 text-[11px] text-slate-600">
                      <span><strong>{docCount}</strong> documents</span>
                      <span>·</span>
                      <span><strong>{c.questions_count || 0}</strong> questions</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200/60 mt-3 flex items-center justify-between">
                    <button
                      onClick={() => {
                        handleSelectExistingCourse(c.course_code);
                        setActiveSubTab('wizard');
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Materials</span>
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(c.course_code)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: RUBRIC CALIBRATION SIMULATOR */}
      {activeSubTab === 'calibrate' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <CheckSquare className="w-5 h-5 mr-2 text-emerald-600" />
                Rubric Calibration & Grading Simulator
              </h2>
              <p className="text-xs text-slate-500">
                Test and verify how the AI evaluates student submissions against your uploaded marking schemes.
              </p>
            </div>

            {/* Course Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-slate-700">Course:</label>
              <select
                value={calibCourse}
                onChange={(e) => setCalibCourse(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-1.5 font-bold focus:outline-none"
              >
                {courses.map((c) => (
                  <option key={c.course_id} value={c.course_code}>
                    {c.course_code} - {c.course_title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Question Selector & Criteria Display */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Select Exam Question to Test
                </label>
                <select
                  value={selectedQuestionId}
                  onChange={(e) => setSelectedQuestionId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl p-2.5 font-medium focus:outline-none"
                >
                  {calibQuestions.map((q) => (
                    <option key={q?.question_id || Math.random()} value={q?.question_id}>
                      {q?.question_number || 'Question'} ({q?.academic_year || 'Session'}) - [{q?.total_marks || 0} Marks] {q?.question_text ? q.question_text.slice(0, 70) + '...' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedQuestionData && (() => {
                const qObj = selectedQuestionData.question || selectedQuestionData;
                const criteriaList = selectedQuestionData.marking_scheme || selectedQuestionData.criteria || [];
                return (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{qObj?.question_number || 'Question'}</span>
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono text-[11px]">
                        Max Marks: {qObj?.total_marks || 0}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 italic leading-relaxed">
                      "{qObj?.question_text || ''}"
                    </p>

                    {/* Marking Scheme Steps Extracted */}
                    <div className="pt-2 border-t border-slate-200 mt-2">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase block mb-1.5">
                        Uploaded Examiner Marking Criteria ({criteriaList.length} steps):
                      </span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {criteriaList.map((crit, idx) => (
                          <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200 text-[11px] space-y-0.5">
                            <div className="flex justify-between font-semibold text-slate-800">
                              <span>Step {crit?.step_number || (idx + 1)}: {crit?.criterion_text}</span>
                              <span className="text-emerald-700 font-mono">[{crit?.allocated_marks || 0}m]</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Expected Keywords: {crit?.expected_keywords || 'N/A'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Sample Student Answer Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Sample Student Answer to Evaluate
                </label>
                <textarea
                  rows={5}
                  value={studentAnswerInput}
                  onChange={(e) => setStudentAnswerInput(e.target.value)}
                  placeholder="Paste or write a student answer to test the grading algorithm..."
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              <button
                onClick={handleRunCalibration}
                disabled={calibrating || !studentAnswerInput.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2"
              >
                {calibrating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Grading Submission against Marking Guide...</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    <span>Run Simulated Grading</span>
                  </>
                )}
              </button>
            </div>

            {/* Right: Calibration Output */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold text-slate-700 block">
                Evaluator Diagnostic Output
              </span>

              {calibResult ? (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">Marks Awarded</span>
                      <p className="text-2xl font-black text-indigo-700">
                        {calibResult.total_score} <span className="text-xs text-slate-400 font-normal">/ {calibResult.max_possible} marks ({calibResult.percentage}%)</span>
                      </p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                      Graded via Rubric
                    </span>
                  </div>

                  {/* Feedback */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-800">Examiner Feedback to Student:</span>
                    <p className="text-slate-600 leading-relaxed">{calibResult.feedback}</p>
                  </div>

                  {/* Breakdown by criteria */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase">Criterion-by-Criterion Scoring:</span>
                    {calibResult.breakdown?.map((b, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-800">{b.criterion}</span>
                          <div className="text-[10px] text-slate-500">
                            Keywords Matched: <span className="font-mono text-emerald-700">{b.matched_keywords?.join(', ') || 'None'}</span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-xs text-indigo-700">
                          {b.awarded_marks} / {b.max_marks}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                  <CheckSquare className="w-8 h-8 text-slate-300" />
                  <p className="text-xs font-medium">Select a question, enter an answer, and click "Run Simulated Grading" to verify how your marking scheme evaluates answers.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: COURSE MATERIALS & QUESTION CATALOG */}
      {activeSubTab === 'catalog' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Departmental Repository & Ingested Course Catalog
              </h2>
              <p className="text-xs text-slate-500">
                Review all documents and past exam question papers active in the vector database.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={catalogCourseFilter}
                onChange={(e) => setCatalogCourseFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-1.5 focus:outline-none"
              >
                <option value="">All Courses ({courses.length})</option>
                {courses.map((c) => (
                  <option key={c.course_id} value={c.course_code}>
                    {c.course_code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table of Ingested Documents */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Title / Filename</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4">Vectors</th>
                  <th className="py-3 px-4">Questions</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {documents
                  .filter((d) => !catalogCourseFilter || d.course_code === catalogCourseFilter)
                  .map((doc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        {doc.course_code}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {doc.file_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize">
                          {doc.document_type ? doc.document_type.replace(/_/g, ' ') : 'Examination Archive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {doc.session || '2023/2024'}
                      </td>
                      <td className="py-3 px-4 font-mono text-indigo-600 font-semibold">
                        {doc.chunks_count || 1} chunks
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {doc.questions_count || 0}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 shrink-0">
                        <button
                          onClick={() => handleInspectChunks(doc)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                          title="Inspect Semantic Chunks & Rubrics"
                        >
                          <Eye className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.document_id, doc.file_name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete Document & Purge Vectors"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: QUALITY CONTROL, LECTURER FEEDBACK LOOP & ANTI-HALLUCINATION GUARDRAILS */}
      {activeSubTab === 'quality' && (
        <div className="space-y-6">
          {/* Header & Controls */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Quality Control, Lecturer Feedback Loop & Anti-Hallucination Guardrails
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Audit institutional grounding faithfulness, track hallucination risks, review student feedback flags, and calibrate verified model answers into the knowledge base.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={loadQualityData}
                disabled={loadingQuality}
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingQuality ? 'animate-spin text-indigo-600' : ''}`} />
                <span>Refresh Metrics</span>
              </button>
            </div>
          </div>

          {/* KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Queries Audited</span>
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {guardrailMetrics?.total_audits || 0}
              </div>
              <p className="text-[11px] text-slate-400">
                Logged in SQLite guardrail_logs
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Hallucination Prevention Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600">
                {guardrailMetrics?.hallucination_prevention_rate ?? 100}%
              </div>
              <p className="text-[11px] text-slate-400">
                Grounded citations & enforced refusals
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Average Faithfulness Score</span>
                <Award className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-purple-700">
                {Math.round((guardrailMetrics?.avg_faithfulness_score || 0) * 100)}%
              </div>
              <p className="text-[11px] text-slate-400">
                Grounding similarity to past papers
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Calibrated Exemplars</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-indigo-600">
                {guardrailMetrics?.feedback_summary?.calibrated_exemplars || 0}
              </div>
              <p className="text-[11px] text-slate-400">
                {guardrailMetrics?.feedback_summary?.flagged_hallucinations || 0} flagged for review
              </p>
            </div>
          </div>

          {/* Section: Lecturer Feedback & Calibration Queue */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span>Lecturer Feedback & Calibration Queue</span>
                  <span className="text-[11px] bg-indigo-50 text-indigo-700 font-mono px-2 py-0.5 rounded-full font-bold">
                    {feedbackList.length} items
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review student and lecturer ratings, report hallucinations, and calibrate gold-standard answers directly into the vector store.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs">
                  {['all', 'flagged', 'pending', 'calibrated'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setFeedbackStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                        feedbackStatusFilter === st
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <select
                  value={feedbackCourseFilter}
                  onChange={(e) => setFeedbackCourseFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.course_id || c.course_code} value={c.course_code}>
                      {c.course_code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Feedback Cards List */}
            {loadingQuality ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="text-slate-400 text-xs">Loading feedback & calibration records...</span>
              </div>
            ) : feedbackList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No feedback records matching the selected filter.</p>
                <p className="text-[11px] text-slate-400">
                  Users and lecturers can rate answers and report hallucinations in the Study Chat interface.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbackList.map((fb) => (
                  <div
                    key={fb.feedback_id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 hover:border-slate-300 transition-all text-xs"
                  >
                    {/* Top Row: Course, Stars, Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-mono">
                          {fb.course_code}
                        </span>
                        <div className="flex items-center space-x-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= fb.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        {fb.is_hallucination && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md">
                            <AlertCircle className="w-3 h-3" />
                            <span>Hallucination Flagged</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          fb.status === 'calibrated'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : fb.status === 'flagged'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {fb.status}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(fb.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Query & AI Response */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-700">
                        <span className="text-slate-400 font-normal">Student Query: </span>
                        {fb.query_text}
                      </div>
                      <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 max-h-24 overflow-y-auto leading-relaxed">
                        <span className="text-slate-400 font-semibold block mb-0.5">AI Answer:</span>
                        {fb.ai_response}
                      </div>
                    </div>

                    {/* Notes & Calibrated Solution */}
                    {fb.feedback_notes && (
                      <div className="text-[11px] text-slate-600 bg-amber-50/60 p-2 rounded-xl border border-amber-200">
                        <span className="font-semibold text-amber-900">Reviewer Note: </span>
                        {fb.feedback_notes}
                      </div>
                    )}

                    {fb.corrected_answer && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 space-y-1 font-mono">
                        <div className="flex items-center space-x-1.5 font-bold text-emerald-900 font-sans">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Lecturer Calibrated Exemplar (Active in Vector Store):</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{fb.corrected_answer}</p>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">
                        Submitted by: {fb.lecturer_name || fb.lecturer_email}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenCalibrateModal(fb)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 shadow-xs cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{fb.corrected_answer ? 'Edit Calibration' : 'Calibrate Solution'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Real-time Anti-Hallucination Guardrail Audit Logs */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span>Guardrail Audit Trail (SQLite guardrail_logs)</span>
                  <span className="text-[11px] bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded-full font-bold">
                    {guardrailLogs.length} recent
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete institutional audit record of retrieval confidence, faithfulness evaluation, and protective guardrail actions.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="pb-3 font-semibold">Time</th>
                    <th className="pb-3 font-semibold">Course</th>
                    <th className="pb-3 font-semibold">Student Query</th>
                    <th className="pb-3 font-semibold text-center">Chunks</th>
                    <th className="pb-3 font-semibold text-center">Max Sim</th>
                    <th className="pb-3 font-semibold text-center">Faithfulness</th>
                    <th className="pb-3 font-semibold text-center">Risk Level</th>
                    <th className="pb-3 font-semibold text-right">Guardrail Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {guardrailLogs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {log.course_code || 'ALL'}
                      </td>
                      <td className="py-3 text-slate-700 max-w-xs truncate" title={log.query_text}>
                        {log.query_text}
                      </td>
                      <td className="py-3 text-center font-mono text-slate-600">
                        {log.retrieved_chunks_count}
                      </td>
                      <td className="py-3 text-center font-mono text-slate-600">
                        {Math.round(log.max_similarity * 100)}%
                      </td>
                      <td className="py-3 text-center font-mono font-bold text-indigo-600">
                        {Math.round(log.faithfulness_score * 100)}%
                      </td>
                      <td className="py-3 text-center whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          log.hallucination_risk === 'LOW_RISK'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.hallucination_risk === 'MODERATE_RISK'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {log.hallucination_risk}
                        </span>
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold border border-slate-200">
                          {log.guardrail_action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LECTURER CALIBRATION MODAL */}
      {selectedFeedbackForCalib && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Lecturer Model Answer Calibration · {selectedFeedbackForCalib.course_code}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Index verified departmental solution into ChromaDB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFeedbackForCalib(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {calibFeedbackSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{calibFeedbackSuccess}</span>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Target Question / Problem:</label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold">
                  {selectedFeedbackForCalib.query_text}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Official Departmental Model Answer & Marking Scheme Criteria *:
                </label>
                <textarea
                  rows={6}
                  value={calibCorrectedText}
                  onChange={(e) => setCalibCorrectedText(e.target.value)}
                  placeholder="Enter the official grading steps, definitions, formulas, and criteria points..."
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedFeedbackForCalib(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={calibratingFeedback || !calibCorrectedText.trim()}
                  onClick={handleExecuteCalibration}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {calibratingFeedback ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Embedding into ChromaDB...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Calibrate into Knowledge Base</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHUNK & RUBRICS INSPECTION MODAL */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Vector Memory Inspection · {inspectingDoc.course_code}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-md">
                    {inspectingDoc.file_name} ({inspectingDoc.session || '2023/2024'})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectingDoc(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-slate-200 px-5 text-xs bg-slate-50">
              <button
                onClick={() => setActiveInspectTab('chunks')}
                className={`py-3 px-4 font-semibold border-b-2 transition-all ${
                  activeInspectTab === 'chunks'
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                ChromaDB Vector Chunks ({docChunksData?.chunks?.length || 0})
              </button>
              <button
                onClick={() => setActiveInspectTab('questions')}
                className={`py-3 px-4 font-semibold border-b-2 transition-all ${
                  activeInspectTab === 'questions'
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Extracted Exam Questions ({docChunksData?.questions?.length || 0})
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 text-xs space-y-3">
              {loadingChunks ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-slate-400 text-[11px]">Loading memory chunks...</span>
                </div>
              ) : activeInspectTab === 'chunks' ? (
                <div className="space-y-3">
                  {docChunksData?.chunks?.map((chunk, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span className="font-bold text-indigo-700">Page {chunk.page_number || 1} · Chunk #{chunk.chunk_index + 1}</span>
                        <div className="flex items-center space-x-2">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold border border-indigo-200">
                            text-embedding-004 (768-dim)
                          </span>
                          <span>{chunk.token_count} tokens</span>
                        </div>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed font-sans text-xs">
                        {chunk.chunk_text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {docChunksData?.questions?.map((q, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span>{q?.question_number || `Question ${i + 1}`} — [{q?.total_marks || 0} Marks]</span>
                        <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                          {q?.topic_tag || 'General'} · {q?.bloom_level || 'Evaluation'}
                        </span>
                      </div>
                      <p className="text-slate-700 italic text-xs leading-relaxed">
                        "{q?.question_text || ''}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
              <span>Status: Verified Ingested in Semantic Vector Store</span>
              <button
                onClick={() => setInspectingDoc(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-1.5 rounded-xl transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE COURSE MODAL */}
      {isCreateCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Create Departmental Course</h3>
                  <p className="text-[11px] text-slate-400">Add an academic course to your curriculum</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateCourseOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourseSubmit} className="p-6 space-y-4">
              {courseCreateSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{courseCreateSuccess}</span>
                </div>
              )}

              {courseCreateError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{courseCreateError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Course Code *</label>
                  <input
                    type="text"
                    required
                    value={newCourse.course_code}
                    onChange={(e) => setNewCourse({ ...newCourse, course_code: e.target.value })}
                    placeholder="e.g. MTH 201"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2 font-mono font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={newCourse.department}
                    onChange={(e) => setNewCourse({ ...newCourse, department: e.target.value })}
                    placeholder="e.g. Mathematics"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  value={newCourse.course_title}
                  onChange={(e) => setNewCourse({ ...newCourse, course_title: e.target.value })}
                  placeholder="e.g. Linear Algebra & Multivariable Calculus"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Level</label>
                  <select
                    value={newCourse.level}
                    onChange={(e) => setNewCourse({ ...newCourse, level: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-2 py-2 focus:outline-none"
                  >
                    <option value={100}>100L</option>
                    <option value={200}>200L</option>
                    <option value={300}>300L</option>
                    <option value={400}>400L</option>
                    <option value={500}>500L</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Semester</label>
                  <select
                    value={newCourse.semester}
                    onChange={(e) => setNewCourse({ ...newCourse, semester: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-2 py-2 focus:outline-none"
                  >
                    <option value="First Semester">First</option>
                    <option value="Second Semester">Second</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Credit Units</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={newCourse.credit_units}
                    onChange={(e) => setNewCourse({ ...newCourse, credit_units: parseInt(e.target.value, 10) || 3 })}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-2 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCourseOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCourse}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 transition-all"
                >
                  {creatingCourse ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Course...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Course</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { 
  FileText, Sparkles, Clock, CheckSquare, Loader2, Award, 
  ChevronRight, Printer, Share2, BookOpen, Layers, CheckCircle2 
} from 'lucide-react';
import { api } from '../services/api';

export default function MockExamView({ courses, selectedCourse, setSelectedCourse, setActiveTab }) {
  const [exam, setExam] = useState(null);
  const [numQuestions, setNumQuestions] = useState(3);
  const [generating, setGenerating] = useState(false);

  const activeCourseCode = selectedCourse || (courses && courses.length > 0 ? courses[0].course_code : 'CSC 321');

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.generateMockExam(activeCourseCode, numQuestions);
      setExam(res);
    } catch (err) {
      console.error(err);
      alert('Failed to generate mock exam.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 animate-in fade-in duration-200">
      {/* Configuration Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Bloom's Taxonomy Cognitive Engine
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">B.Sc. Degree Standard</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center pt-0.5">
            <FileText className="w-5 h-5 mr-2 text-purple-600" />
            Degree Past-Paper Mock Exam Generator
          </h2>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            Assembles authentic mock exam papers based on real historical departmental past questions and syllabus distributions.
          </p>
        </div>

        {/* Controls: Course selector, Question count, Generate Button */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
          {/* Course Dropdown */}
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase text-slate-400 pl-1 mb-0.5">Target Course</span>
            <select
              value={activeCourseCode}
              onChange={(e) => setSelectedCourse && setSelectedCourse(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
            >
              {courses && courses.map((c) => (
                <option key={c.course_id || c.course_code} value={c.course_code}>
                  {c.course_code}
                </option>
              ))}
            </select>
          </div>

          {/* Question Count Dropdown */}
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase text-slate-400 pl-1 mb-0.5">Length</span>
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
            >
              <option value={2}>2 Questions (Quiz)</option>
              <option value={3}>3 Questions (Standard)</option>
              <option value={4}>4 Questions (Full Paper)</option>
              <option value={5}>5 Questions (Comprehensive)</option>
            </select>
          </div>

          {/* Generate Button */}
          <div className="flex flex-col justify-end pt-3 sm:pt-0">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer h-8"
            >
              {generating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Assembling...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Exam</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Paper View */}
      {exam ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in duration-300">
          {/* Institutional Examination Formal Header */}
          <div className="bg-slate-950 text-white p-6 sm:p-8 text-center border-b border-slate-800 space-y-2 relative">
            <div className="absolute top-4 right-4 flex items-center space-x-2 print:hidden">
              <button
                onClick={handlePrint}
                className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                title="Print or Save PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print Paper</span>
              </button>
            </div>

            <h1 className="text-base sm:text-lg font-black tracking-wider uppercase text-slate-100">
              {exam.institution || "Higher Institution"}
            </h1>
            <h2 className="text-xs font-bold tracking-widest uppercase text-purple-400">
              {exam.faculty || "Faculty of Computing"} · {exam.department || "Department of Computer Science"}
            </h2>
            <h3 className="text-sm font-bold text-slate-300 pt-1">
              B.SC. DEGREE PRACTICE EXAMINATION ({exam.session})
            </h3>
            <div className="inline-block bg-slate-900 border border-slate-700 px-4 py-1.5 rounded-xl text-xs font-mono font-bold text-purple-300 mt-1 shadow-inner">
              {exam.course_code}: {exam.course_title}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-3 text-xs text-slate-300 border-t border-slate-800/80 mt-3">
              <span className="flex items-center font-medium">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> Time Allowed: 2 Hours
              </span>
              <span className="flex items-center font-bold text-emerald-400">
                <Award className="w-3.5 h-3.5 mr-1.5" /> Total Exam Marks: {exam.total_marks}
              </span>
              <span className="flex items-center text-slate-400">
                <CheckSquare className="w-3.5 h-3.5 mr-1.5 text-purple-400" /> {exam.questions.length} Questions
              </span>
            </div>

            <p className="text-[11px] text-amber-300/90 font-mono tracking-tight pt-2 italic max-w-xl mx-auto">
              {exam.instructions}
            </p>
          </div>

          {/* Exam Questions Body */}
          <div className="p-6 sm:p-8 space-y-6 divide-y divide-slate-100">
            {exam.questions.map((q, idx) => (
              <div key={idx} className="pt-6 first:pt-0 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-black text-slate-900 text-sm bg-slate-100 px-2.5 py-1 rounded-xl">
                      Question {idx + 1}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Ref: {q?.question_number || `Q${idx + 1}`} · Session {q?.academic_year || 'Authentic'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] bg-purple-50 text-purple-800 font-bold px-2.5 py-0.5 rounded-lg border border-purple-200">
                      Bloom: {q?.bloom_level || 'Evaluation'}
                    </span>
                    <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                      {q?.total_marks || 0} Marks
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/90 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                  {q?.question_text || ''}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-0.5">
                  <span className="text-slate-500 text-[11px]">
                    Syllabus Topic: <strong className="text-slate-800 font-mono">{q.topic_tag}</strong>
                  </span>
                  <button
                    onClick={() => {
                      if (setSelectedCourse) setSelectedCourse(exam.course_code);
                      if (setActiveTab) setActiveTab('evaluation');
                    }}
                    className="text-purple-600 hover:text-purple-800 font-bold flex items-center space-x-1 hover:underline text-xs group cursor-pointer print:hidden"
                  >
                    <span>Practice & Grade in Rubric Evaluation Portal</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-3 shadow-2xs">
          <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">No Mock Examination Assembled Yet</h3>
          <p className="text-xs max-w-sm mx-auto leading-relaxed text-slate-500">
            Select your desired course (e.g. <strong>{activeCourseCode}</strong>) and question count above, then click <strong>"Generate Exam"</strong> to simulate an authentic university degree examination paper.
          </p>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { BookOpen, GraduationCap, Sparkles, CheckCircle2, BarChart3, FileText, UserCheck } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, courses, selectedCourse, setSelectedCourse }) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 py-2 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium text-slate-200">University of Ibadan · Department of Computer Science</span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline">2024/2025 Academic Session</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="bg-slate-800 text-sky-400 px-2 py-0.5 rounded font-mono text-[11px] border border-sky-500/20">
            Matric: 230880 (Final Year)
          </span>
          <span className="text-slate-400 hidden md:inline">5 Exam Sessions Ingested</span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and Identity */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('chat')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-sky-100 to-sky-300 bg-clip-text text-transparent">
                CourseGPT
              </span>
              <span className="bg-sky-500/10 text-sky-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-sky-500/30">
                UI CSC Agent
              </span>
            </div>
            <p className="text-xs text-slate-400">Course-Aware AI Study Assistant & Evaluation Engine</p>
          </div>
        </div>

        {/* Global Course Context Selector */}
        <div className="flex items-center space-x-2 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/80">
          <BookOpen className="w-4 h-4 text-sky-400 ml-1.5" />
          <label className="text-xs text-slate-300 font-medium">Focus Course:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="bg-slate-900 text-white text-xs rounded border border-slate-700 px-2.5 py-1 focus:outline-none focus:border-sky-500 font-medium"
          >
            <option value="">All CSC Courses</option>
            {courses.map((c) => (
              <option key={c.course_id} value={c.course_code}>
                {c.course_code} - {c.course_title} ({c.level}L)
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>ReAct Q&A</span>
          </button>

          <button
            onClick={() => setActiveTab('evaluation')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'evaluation'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Rubric Scoring</span>
          </button>

          <button
            onClick={() => setActiveTab('heatmap')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'heatmap'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Topic Heatmap</span>
          </button>

          <button
            onClick={() => setActiveTab('mock')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'mock'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Mock Exam</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'analytics'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Diagnostics</span>
          </button>
        </nav>
      </div>
    </header>
  );
}

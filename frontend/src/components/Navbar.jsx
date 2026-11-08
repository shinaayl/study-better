import React from 'react';
import { 
  BookOpen, GraduationCap, Sparkles, CheckCircle2, BarChart3, 
  FileText, UserCheck, Database, Settings, LogIn, LogOut, 
  ArrowLeftRight, ShieldCheck, User, ChevronDown 
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  courses,
  selectedCourse,
  setSelectedCourse,
  systemSettings,
  onOpenSettings,
  currentUser,
  onOpenAuthModal,
  onSwitchRole,
  onLogout,
}) {
  const institution = currentUser?.institution || systemSettings?.institution || 'Universal Higher Institutions';
  const department = currentUser?.department || 'Multi-Department Framework';
  const isLecturer = currentUser?.role === 'lecturer';

  // Group courses by department
  const byDept = {};
  courses.forEach((c) => {
    const dept = c.department || 'General Studies';
    if (!byDept[dept]) byDept[dept] = [];
    byDept[dept].push(c);
  });

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      {/* Top Banner: Universality Note & Account Status */}
      <div className="max-w-7xl mx-auto px-4 py-1.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-slate-200">
            {institution}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-sky-300 font-medium">
            {department}
          </span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline text-slate-400">
            Universal Framework for Any Faculty & Department (Tested with CS test-case)
          </span>
        </div>

        {/* Global Settings & Quick Actions */}
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded-full border border-slate-800">
            {courses.length} Courses Cataloged
          </span>
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1 text-slate-300 hover:text-white hover:bg-slate-800/80 px-2 py-0.5 rounded-lg transition-colors"
            title="Configure System & LLM Provider"
          >
            <Settings className="w-3.5 h-3.5 text-sky-400" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and Identity */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group" 
          onClick={() => setActiveTab(isLecturer ? 'lecturer' : 'chat')}
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-indigo-600/25 group-hover:scale-105 transition-all">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
                Study Better
              </span>
              <span className="bg-purple-500/20 text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-500/40 uppercase tracking-wider">
                Study Better
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Universal Multi-Department Academic Revision & Ingestion Engine
            </p>
          </div>
        </div>

        {/* Global Course Context Selector */}
        <div className="flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          <BookOpen className="w-4 h-4 text-sky-400 ml-1.5 shrink-0" />
          <label className="text-xs text-slate-300 font-semibold hidden sm:inline">Course Context:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="bg-slate-950 text-white text-xs rounded-xl border border-slate-700 px-3 py-1.5 focus:outline-none focus:border-sky-500 font-medium max-w-[190px] sm:max-w-[250px]"
          >
            <option value="">All Ingested Courses</option>
            {Object.entries(byDept).map(([deptName, deptCourses]) => (
              <optgroup key={deptName} label={`Faculty: ${deptName}`}>
                {deptCourses.map((c) => (
                  <option key={c.course_id} value={c.course_code}>
                    {c.course_code} - {c.course_title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* PROMINENT GOOGLE AUTHENTICATION & ROLE BAR */}
        <div className="flex items-center space-x-2">
          {currentUser ? (
            /* Logged In User Pill with Switchers */
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700/80 rounded-2xl p-1 pr-2.5 shadow-sm">
              {currentUser.picture ? (
                <img
                  src={currentUser.picture}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-xl object-cover border border-slate-600 shadow-sm"
                />
              ) : (
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  {currentUser.name?.[0] || 'U'}
                </div>
              )}
              
              <div className="flex flex-col text-left">
                <span className="font-bold text-slate-100 text-xs leading-none max-w-[130px] truncate">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isLecturer ? 'bg-indigo-400' : 'bg-emerald-400'}`}></span>
                  <span>{isLecturer ? 'Lecturer / Examiner' : 'Student'}</span>
                </span>
              </div>

              {/* Quick Role Toggle */}
              <button
                onClick={onSwitchRole}
                className="ml-1 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-xl px-2.5 py-1 text-[11px] font-semibold flex items-center space-x-1 transition-all shadow-sm"
                title={`Switch active view to ${isLecturer ? 'Student' : 'Lecturer'}`}
              >
                <ArrowLeftRight className="w-3 h-3 text-sky-400" />
                <span className="hidden sm:inline">{isLecturer ? 'Student View' : 'Lecturer View'}</span>
              </button>

              {/* Change Google Account */}
              <button
                onClick={onOpenAuthModal}
                className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl px-2 py-1 text-[11px] font-semibold transition-all shadow-sm"
                title="Switch Google Account"
              >
                {/* Small Google G logo */}
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span className="hidden md:inline">Google</span>
              </button>

              {/* Log Out */}
              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Standalone Google Sign In Button */
            <button
              onClick={onOpenAuthModal}
              className="flex items-center space-x-2 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs px-4 py-2 rounded-2xl shadow-md shadow-white/10 hover:shadow-lg transition-all border border-slate-200"
            >
              {/* Google 4-color G logo */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="border-t border-slate-800/80 bg-slate-900/60 backdrop-blur px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto py-1.5 gap-2">
          <nav className="flex items-center space-x-1.5">
            {isLecturer ? (
              /* LECTURER TABS */
              <>
                <button
                  onClick={() => setActiveTab('lecturer')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'lecturer'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Database className="w-4 h-4 text-indigo-300" />
                  <span>👨‍🏫 Lecturer Ingestion Portal</span>
                </button>

                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'chat'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-sky-300" />
                  <span>Test Study Agent</span>
                </button>

                <button
                  onClick={() => setActiveTab('evaluation')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'evaluation'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Rubric Scoring</span>
                </button>

                <button
                  onClick={() => setActiveTab('heatmap')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'heatmap'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <span>Topic Frequency Heatmap</span>
                </button>

                <button
                  onClick={() => setActiveTab('mock')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'mock'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Mock Exam Generator</span>
                </button>
              </>
            ) : (
              /* STUDENT TABS */
              <>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'chat'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-sky-300" />
                  <span>💬 Study Chat</span>
                </button>

                <button
                  onClick={() => setActiveTab('evaluation')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'evaluation'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>🎯 Rubric Practice</span>
                </button>

                <button
                  onClick={() => setActiveTab('heatmap')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'heatmap'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <span>📊 Topic Heatmap</span>
                </button>

                <button
                  onClick={() => setActiveTab('mock')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'mock'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>📝 Mock Exam</span>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'analytics'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>📈 My Diagnostics</span>
                </button>
              </>
            )}
          </nav>

          {/* Role Indicator Banner */}
          <div className="flex items-center space-x-2 text-[11px] font-medium shrink-0">
            <span className="text-slate-400 hidden lg:inline">Active Mode:</span>
            <span className={`px-2 py-0.5 rounded-lg font-bold ${
              isLecturer ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50' : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
            }`}>
              {isLecturer ? 'Lecturer / Ingestion Console' : 'Student Study Console'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

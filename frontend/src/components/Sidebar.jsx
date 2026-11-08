import React from 'react';
import { 
  Plus, MessageSquare, BookOpen, CheckSquare, FileText, 
  BarChart3, UploadCloud, Database, Settings, LogOut, 
  GraduationCap, ShieldCheck, ChevronRight, User, Award, 
  Sparkles, Layers, RefreshCw
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  currentUser,
  onNewChat,
  chatSessions,
  currentChatId,
  onSelectChat,
  onOpenProfile,
  onOpenSettings,
  onLogout,
  onToggleRole,
  isFacultyAccount: isFacultyProp,
  isOpen,
  onClose
}) {
  const isFacultyAccount = Boolean(
    isFacultyProp || 
    currentUser?.is_faculty || 
    currentUser?.role === 'lecturer' || 
    currentUser?.role === 'admin'
  );
  const isLecturer = currentUser?.role === 'lecturer';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-purple-950/20 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Main Sidebar Panel */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-white text-slate-700 flex flex-col justify-between
        border-r border-purple-200/80 transition-transform duration-200 ease-in-out shadow-xs
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Top: Branding & New Chat */}
        <div className="p-4 space-y-3.5 border-b border-purple-100">
          {/* Logo & University Portal Name */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-700 flex items-center justify-center text-white shadow-md shadow-purple-700/20">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-slate-900 block leading-tight">
                  Study Better
                </span>
                <span className="text-[10px] text-purple-700 font-semibold block">
                  Academic Revision & Rubrics
                </span>
              </div>
            </div>

            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-purple-50 text-purple-900 border-purple-200">
              {isLecturer ? 'Examiner' : 'Student'}
            </span>
          </div>

          {/* "+ New Study Session" Button */}
          <button
            onClick={() => {
              if (onNewChat) onNewChat();
              setActiveTab('chat');
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-between bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold px-3 py-2.5 rounded-xl transition-all shadow-xs group"
          >
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4 text-purple-200 group-hover:scale-110 transition-transform" />
              <span>New Study Session</span>
            </div>
            <span className="text-[10px] text-purple-200 font-mono">Revision</span>
          </button>
        </div>

        {/* Middle: Academic Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 text-xs">
          {/* ACADEMIC MODULES */}
          <div>
            <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-purple-900 block mb-2">
              {isLecturer ? 'Faculty & Examination Studio' : 'Academic Revision Modules'}
            </span>

            <nav className="space-y-1">
              {isLecturer ? (
                /* LECTURER WORKSPACE TABS */
                <>
                  <button
                    onClick={() => {
                      setActiveTab('lecturer');
                      if (onClose) onClose();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                      activeTab === 'lecturer'
                        ? 'bg-purple-100 text-purple-950 font-bold border-l-4 border-purple-700 shadow-2xs'
                        : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4 text-purple-700" />
                    <span>Upload Syllabus & Papers</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('chat');
                      if (onClose) onClose();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                      activeTab === 'chat'
                        ? 'bg-purple-100 text-purple-950 font-bold border-l-4 border-purple-700 shadow-2xs'
                        : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-purple-700" />
                    <span>Test AI Revision Engine</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('evaluation');
                      if (onClose) onClose();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                      activeTab === 'evaluation'
                        ? 'bg-purple-100 text-purple-950 font-bold border-l-4 border-purple-700 shadow-2xs'
                        : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4 text-purple-700" />
                    <span>Calibrate Marking Rubrics</span>
                  </button>
                </>
              ) : (
                /* STUDENT STUDY TABS */
                <>
                  <button
                    onClick={() => {
                      setActiveTab('chat');
                      if (onClose) onClose();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                      activeTab === 'chat'
                        ? 'bg-purple-100 text-purple-950 font-bold border-l-4 border-purple-700 shadow-2xs'
                        : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-purple-700" />
                    <span>Course Q&A & Revision</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('evaluation');
                      if (onClose) onClose();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                      activeTab === 'evaluation'
                        ? 'bg-purple-100 text-purple-950 font-bold border-l-4 border-purple-700 shadow-2xs'
                        : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4 text-purple-700" />
                    <span>Marking Scheme Evaluator</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('mock');
                      if (onClose) onClose();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                      activeTab === 'mock'
                        ? 'bg-purple-100 text-purple-950 font-bold border-l-4 border-purple-700 shadow-2xs'
                        : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-purple-700" />
                    <span>University Mock Exams</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('heatmap');
                      if (onClose) onClose();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                      activeTab === 'heatmap'
                        ? 'bg-purple-100 text-purple-950 font-bold border-l-4 border-purple-700 shadow-2xs'
                        : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-purple-700" />
                    <span>Exam Topic Trends</span>
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* RECENT TOPIC SESSIONS */}
          <div>
            <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-purple-900 block mb-2">
              Recent Revision Topics
            </span>

            <div className="space-y-0.5">
              {(chatSessions && chatSessions.length > 0) ? (
                chatSessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (onSelectChat) onSelectChat(s.id);
                      setActiveTab('chat');
                      if (onClose) onClose();
                    }}
                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left truncate transition-colors ${
                      currentChatId === s.id
                        ? 'bg-purple-50 text-purple-950 font-semibold'
                        : 'text-slate-500 hover:text-purple-900 hover:bg-purple-50/50'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">{s.title || 'Study Session'}</span>
                  </button>
                ))
              ) : (
                <div className="px-2.5 py-2 text-[11px] text-slate-400 italic">
                  Ask any exam or course question to begin.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom: University Profile Card & Actions */}
        <div className="p-3 border-t border-purple-100 bg-purple-50/40 space-y-2">
          {currentUser && (
            <div 
              onClick={onOpenProfile}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-purple-100/60 cursor-pointer transition-colors group"
              title="Click to view full profile details"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                {currentUser.picture ? (
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-xl object-cover border border-purple-300 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 bg-purple-700">
                    {currentUser.name?.[0] || 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 block truncate group-hover:text-purple-900">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-purple-800 font-medium block truncate">
                    {currentUser.department || 'Computer Science'}
                  </span>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-purple-400 group-hover:text-purple-900 transition-colors shrink-0" />
            </div>
          )}

          {onToggleRole && isFacultyAccount && (
            <button
              onClick={onToggleRole}
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-xl text-[10px] font-bold bg-white hover:bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span>{isLecturer ? 'Preview as Student' : 'Return to Lecturer Mode'}</span>
            </button>
          )}

          <div className="flex items-center justify-between pt-1.5 border-t border-purple-200/60 text-[11px] px-1">
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-1.5 text-slate-500 hover:text-purple-900 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>

            <button
              onClick={onLogout}
              className="flex items-center space-x-1 text-slate-500 hover:text-rose-600 transition-colors"
              title="Log out of account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

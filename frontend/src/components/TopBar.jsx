import React from 'react';
import { Menu, ShieldCheck, User, Settings, Database, GraduationCap, ChevronDown, Sparkles } from 'lucide-react';

export default function TopBar({
  activeTab,
  currentUser,
  isFacultyAccount: isFacultyProp,
  onToggleSidebar,
  onOpenProfile,
  onOpenSettings,
  totalCoursesCount,
  onToggleRole
}) {
  const isFacultyAccount = Boolean(
    isFacultyProp || 
    currentUser?.is_faculty || 
    currentUser?.role === 'lecturer' || 
    currentUser?.role === 'admin'
  );
  const isLecturer = currentUser?.role === 'lecturer';

  const tabTitles = {
    chat: 'Academic Study & Revision Chat',
    evaluation: isLecturer ? 'Examiner Rubric Calibration' : 'Marking Scheme Practice & Evaluation',
    mock: 'University Degree Mock Examination',
    heatmap: 'Exam Topic Frequency & Trend Analysis',
    analytics: 'Continuous Assessment & Diagnostics',
    lecturer: 'Faculty Knowledge Ingestion & AI Learning Studio'
  };

  const title = tabTitles[activeTab] || 'Study Better';

  return (
    <header className="h-16 bg-white border-b border-purple-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile Toggle & View Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden text-purple-900 hover:text-purple-700 p-2 rounded-xl hover:bg-purple-50 transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
              {title}
            </h1>
            <div className="flex items-center space-x-1.5 text-[11px] text-purple-800">
              <span className="font-semibold">{currentUser?.institution || 'University of Ibadan'}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-medium">{currentUser?.department || 'Computer Science'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Continuous Lecturer Learning Indicator & User Profile Trigger */}
      <div className="flex items-center space-x-3 text-xs">
        {/* Continuous Lecturer Learning Active Badge */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-purple-50 text-purple-900 border border-purple-200 px-3 py-1 rounded-full text-[11px] font-semibold shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Continuous Lecturer Learning Active</span>
        </div>

        {/* Instant Role Toggle Pill - ONLY FOR VERIFIED FACULTY / LECTURER ACCOUNTS */}
        {onToggleRole && isFacultyAccount && (
          <button
            onClick={onToggleRole}
            className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
              isLecturer
                ? 'bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-300'
                : 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-sm'
            }`}
            title={isLecturer ? 'Click to preview Student Revision View' : 'Click to return to Lecturer / Examiner Upload Mode'}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLecturer ? 'Preview as Student' : 'Return to Lecturer Mode'}</span>
          </button>
        )}

        {/* User Profile Trigger Button */}
        {currentUser && (
          <button
            onClick={onOpenProfile}
            className="flex items-center space-x-2 bg-purple-50/60 hover:bg-purple-100/70 border border-purple-200 rounded-2xl p-1 pr-3 transition-all shadow-2xs group"
            title="Click to view full profile details"
          >
            {currentUser.picture ? (
              <img
                src={currentUser.picture}
                alt={currentUser.name}
                className="w-7 h-7 rounded-xl object-cover border border-purple-300"
              />
            ) : (
              <div className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs text-white bg-purple-700">
                {currentUser.name?.[0] || 'U'}
              </div>
            )}

            <div className="flex flex-col text-left">
              <span className="font-bold text-slate-900 text-[11px] leading-tight group-hover:text-purple-700 transition-colors">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-purple-800 font-medium capitalize">
                {isLecturer ? 'Examiner / Lecturer' : 'Student (Undergrad)'}
              </span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-purple-500 group-hover:text-purple-800 transition-colors ml-0.5" />
          </button>
        )}
      </div>
    </header>
  );
}

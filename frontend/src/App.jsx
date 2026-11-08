import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ChatInterface from './components/ChatInterface';
import EvaluationPortal from './components/EvaluationPortal';
import TopicHeatmap from './components/TopicHeatmap';
import MockExamView from './components/MockExamView';
import PerformanceDashboard from './components/PerformanceDashboard';
import LecturerDashboard from './components/LecturerDashboard';
import SettingsModal from './components/SettingsModal';
import UserProfileModal from './components/UserProfileModal';
import AuthGateway from './components/AuthGateway';
import { api } from './services/api';

export default function App() {
  // If user previously logged in, restore from localStorage. Otherwise null (unauthenticated).
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('ai_study_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState(currentUser?.role === 'lecturer' ? 'lecturer' : 'chat');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [systemSettings, setSystemSettings] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatKey, setChatKey] = useState(1);

  const loadCourses = () => {
    api.getCourses()
      .then((res) => {
        setCourses(res.courses || []);
        if (res.courses && res.courses.length > 0 && !selectedCourse) {
          const c321 = res.courses.find((c) => c.course_code === 'CSC 321');
          if (c321) setSelectedCourse('CSC 321');
          else setSelectedCourse(res.courses[0].course_code);
        }
      })
      .catch((err) => console.error('Failed to load courses:', err));
  };

  const loadSettings = () => {
    api.getSettings()
      .then((data) => setSystemSettings(data))
      .catch((err) => console.error('Failed to load settings:', err));
  };

  useEffect(() => {
    loadCourses();
    loadSettings();
  }, []);

  const isFacultyAccount = Boolean(
    currentUser?.is_faculty || 
    currentUser?.role === 'lecturer' || 
    currentUser?.role === 'admin'
  );

  const handleUserAuthenticated = (user) => {
    setCurrentUser(user);
    setActiveTab(user.role === 'lecturer' ? 'lecturer' : 'chat');
  };

  const handleToggleRole = async () => {
    if (!currentUser) return;
    // Strict RBAC Guard: Students cannot switch to lecturer mode.
    // Only verified faculty accounts are permitted to toggle preview view.
    if (!isFacultyAccount) {
      console.warn('Unauthorized role switch attempt blocked: only verified lecturers can toggle roles.');
      return;
    }

    const isCurrentlyLecturer = currentUser.role === 'lecturer';
    const newRole = isCurrentlyLecturer ? 'student' : 'lecturer';
    const newTitle = newRole === 'lecturer' 
      ? 'Senior Lecturer & Course Examiner' 
      : 'Undergraduate Student (Preview)';
    const newName = newRole === 'lecturer'
      ? (currentUser.name?.startsWith('Dr.') ? currentUser.name : `Dr. ${currentUser.name || 'Babalola'}`)
      : (currentUser.name?.replace(/^Dr\.\s*/, '') || 'Dr. Babalola');

    const updatedUser = {
      ...currentUser,
      is_faculty: true,
      role: newRole,
      title: newTitle,
      name: newName
    };

    try {
      const res = await api.googleLogin(updatedUser);
      const syncedUser = res.user || updatedUser;
      syncedUser.is_faculty = true;
      setCurrentUser(syncedUser);
      localStorage.setItem('ai_study_user', JSON.stringify(syncedUser));
      if (newRole === 'lecturer') {
        setActiveTab('lecturer');
      }
    } catch (err) {
      setCurrentUser(updatedUser);
      localStorage.setItem('ai_study_user', JSON.stringify(updatedUser));
      if (newRole === 'lecturer') {
        setActiveTab('lecturer');
      }
    }
  };

  const handleProfileUpdated = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('ai_study_user', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    api.logout().finally(() => {
      localStorage.removeItem('ai_study_user');
      setCurrentUser(null);
      setActiveTab('chat');
    });
  };

  const handleNewChat = () => {
    setChatKey((prev) => prev + 1);
    setActiveTab('chat');
  };

  // UNAUTHENTICATED: DISPLAY DEDICATED GOOGLE AUTHENTICATION & ROLE ONBOARDING GATEWAY
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50/50 text-slate-800 font-sans antialiased">
        <AuthGateway onUserAuthenticated={handleUserAuthenticated} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#faf9fe] text-slate-800 font-sans antialiased overflow-hidden">
      {/* Modern Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        isFacultyAccount={isFacultyAccount}
        onNewChat={handleNewChat}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        onToggleRole={isFacultyAccount ? handleToggleRole : null}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Minimalist Header with Anti-Hallucination Status & User Profile Trigger */}
        <TopBar
          activeTab={activeTab}
          currentUser={currentUser}
          isFacultyAccount={isFacultyAccount}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          totalCoursesCount={courses.length}
          onToggleRole={isFacultyAccount ? handleToggleRole : null}
        />

        {/* Viewport for Active Workspace Module */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-purple-50/25 via-white to-purple-50/15">
          {/* STUDY CHAT: Natural query across all courses in memory without dropdown */}
          {activeTab === 'chat' && (
            <ChatInterface
              key={chatKey}
              currentUser={currentUser}
              selectedCourse={selectedCourse}
              setSelectedCourse={setSelectedCourse}
            />
          )}

          {/* LECTURER KNOWLEDGE INGESTION DASHBOARD (RBAC Route Guard) */}
          {activeTab === 'lecturer' && (
            currentUser.role === 'lecturer' || currentUser.role === 'admin' ? (
              <LecturerDashboard
                currentUser={currentUser}
                courses={courses}
                onCoursesUpdated={setCourses}
                selectedCourse={selectedCourse}
                setSelectedCourse={setSelectedCourse}
              />
            ) : (
              <div className="p-8 max-w-2xl mx-auto my-12 bg-white border border-purple-200/80 rounded-3xl shadow-lg text-center space-y-4 animate-in fade-in duration-200">
                <div className="w-14 h-14 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
                  🔒
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    Faculty Restricted Area · Verified Lecturers Only
                  </span>
                  <h2 className="text-xl font-black text-slate-900 pt-1">
                    Upload & Ingest Course Materials
                  </h2>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  Course document uploads, past papers ingestion, and marking scheme calibration are strictly restricted to verified departmental lecturers and course examiners.
                  Students are not authorized to access this portal or switch to lecturer mode.
                </p>
                <div className="pt-2 flex items-center justify-center">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-purple-700/20 transition-all cursor-pointer flex items-center space-x-2"
                  >
                    <span>← Return to AI Revision Chat</span>
                  </button>
                </div>
              </div>
            )
          )}

          {/* RUBRIC SCORING & PRACTICE */}
          {activeTab === 'evaluation' && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto">
              <EvaluationPortal
                courses={courses}
                selectedCourse={selectedCourse}
                setSelectedCourse={setSelectedCourse}
              />
            </div>
          )}

          {/* TOPIC RECURRENCE HEATMAP */}
          {activeTab === 'heatmap' && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto">
              <TopicHeatmap
                selectedCourse={selectedCourse}
                setSelectedCourse={setSelectedCourse}
                setActiveTab={setActiveTab}
              />
            </div>
          )}

          {/* MOCK EXAMINATION GENERATOR */}
          {activeTab === 'mock' && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto">
              <MockExamView
                courses={courses}
                selectedCourse={selectedCourse}
                setSelectedCourse={setSelectedCourse}
                setActiveTab={setActiveTab}
              />
            </div>
          )}

          {/* STUDENT PERFORMANCE & DIAGNOSTICS */}
          {activeTab === 'analytics' && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto">
              <PerformanceDashboard
                selectedCourse={selectedCourse}
                setActiveTab={setActiveTab}
              />
            </div>
          )}
        </main>
      </div>

      {/* Dedicated User Profile Modal (Strictly NO role switcher) */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={handleProfileUpdated}
        onLogout={handleLogout}
      />

      {/* System Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsUpdated={(updated) => setSystemSettings(updated)}
      />
    </div>
  );
}

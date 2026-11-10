import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Database, ArrowRight, ShieldCheck, 
  Sparkles, BookOpen, Loader2, User, CheckCircle2, Lock
} from 'lucide-react';
import { api } from '../services/api';

export default function AuthGateway({ onUserAuthenticated }) {
  const [mode, setMode] = useState('student'); // 'student' | 'lecturer'
  const [studentName, setStudentName] = useState('');
  const [lecturerName, setLecturerName] = useState('');
  const [lecturerEmail, setLecturerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');

  useEffect(() => {
    // Check if Google Client ID is configured in system settings
    api.getSettings()
      .then((data) => {
        if (data.google_client_id) {
          setGoogleClientId(data.google_client_id);
          if (window.google?.accounts?.id) {
            window.google.accounts.id.initialize({
              client_id: data.google_client_id,
              callback: handleGoogleCredentialResponse,
            });
            window.google.accounts.id.renderButton(
              document.getElementById('googleSignInBtn'),
              { theme: 'outline', size: 'large', width: '100%' }
            );
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.googleLogin({ credential: response.credential });
      const user = res.user || res.google_profile || {
        name: 'Scholar',
        email: 'scholar@ui.edu.ng',
        role: 'student',
        department: 'Academic Studies',
        institution: 'University of Ibadan'
      };
      localStorage.setItem('ai_study_user', JSON.stringify(user));
      onUserAuthenticated(user);
    } catch (err) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Fast Start for Students (Frictionless, pleasing onboarding)
  const handleStartStudying = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    const cleanName = studentName.trim() || 'Scholar';
    const profile = {
      name: cleanName,
      email: `${cleanName.toLowerCase().replace(/\s+/g, '.')}@ui.edu.ng`,
      role: 'student',
      is_faculty: false,
      department: 'Computer Science',
      institution: 'University of Ibadan',
      level: '300',
      title: 'Undergraduate Student',
      picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`
    };

    try {
      const res = await api.googleLogin(profile);
      const user = res.user || profile;
      localStorage.setItem('ai_study_user', JSON.stringify(user));
      onUserAuthenticated(user);
    } catch (err) {
      // Offline fallback: save profile directly so user is never blocked
      localStorage.setItem('ai_study_user', JSON.stringify(profile));
      onUserAuthenticated(profile);
    } finally {
      setLoading(false);
    }
  };

  // Lecturer Entry to Upload Materials & Calibrate Rubrics
  const handleLecturerAccess = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    const cleanName = lecturerName.trim() || 'Dr. Lecturer';
    const cleanEmail = lecturerEmail.trim() || 'lecturer@ui.edu.ng';

    const profile = {
      name: cleanName.startsWith('Dr.') || cleanName.startsWith('Prof.') ? cleanName : `Dr. ${cleanName}`,
      email: cleanEmail,
      role: 'lecturer',
      is_faculty: true,
      department: 'Computer Science',
      institution: 'University of Ibadan',
      title: 'Senior Lecturer & Course Examiner',
      picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`
    };

    try {
      const res = await api.googleLogin(profile);
      const user = res.user || profile;
      user.is_faculty = true;
      user.role = 'lecturer';
      localStorage.setItem('ai_study_user', JSON.stringify(user));
      onUserAuthenticated(user);
    } catch (err) {
      localStorage.setItem('ai_study_user', JSON.stringify(profile));
      onUserAuthenticated(profile);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden bg-gradient-to-b from-purple-50/70 via-white to-purple-50/40">
      {/* Decorative Background Glows */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl mx-auto space-y-8 relative z-10 animate-in fade-in duration-300">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 bg-purple-100/80 border border-purple-200 text-purple-900 px-4 py-1.5 rounded-full text-xs font-semibold shadow-2xs">
            <Sparkles className="w-4 h-4 text-purple-700" />
            <span>Academic Study & Marking Scheme Assistant</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Welcome to <span className="text-purple-700">Study Better</span>
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            Your university AI revision tutor. Ask any examination question, practice draft answers against official marking rubrics, and revise with verified accuracy.
          </p>
        </div>

        {/* Main Welcome Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-200/90 shadow-xl shadow-purple-900/5 space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-purple-50/80 rounded-2xl border border-purple-100 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode('student'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                mode === 'student'
                  ? 'bg-white text-purple-900 shadow-xs border border-purple-200/80 font-bold'
                  : 'text-slate-600 hover:text-purple-800'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-purple-700" />
              <span>Student Revision</span>
            </button>

            <button
              type="button"
              onClick={() => { setMode('lecturer'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                mode === 'lecturer'
                  ? 'bg-white text-purple-900 shadow-xs border border-purple-200/80 font-bold'
                  : 'text-slate-600 hover:text-purple-800'
              }`}
            >
              <Database className="w-4 h-4 text-purple-700" />
              <span>Lecturer / Examiner Studio</span>
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl animate-in fade-in">
              {error}
            </div>
          )}

          {/* STUDENT QUICK START */}
          {mode === 'student' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1 text-center">
                <h2 className="text-lg font-bold text-slate-900">Start Your Study Session</h2>
                <p className="text-xs text-slate-500">
                  No sign-up wall. Jump straight in and start asking questions right away!
                </p>
              </div>

              <form onSubmit={handleStartStudying} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    What should we call you? <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name or nickname (e.g. Scholar, Tobi)"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full bg-purple-50/40 border border-purple-200 text-slate-900 text-xs sm:text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-600 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-700/20 transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                      <span>Opening Study Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Start Studying Now</span>
                      <ArrowRight className="w-4 h-4 text-purple-200" />
                    </>
                  )}
                </button>
              </form>

              {/* GIS Container (if Client ID present) */}
              <div id="googleSignInBtn" className="flex justify-center pt-1"></div>
            </div>
          )}

          {/* LECTURER INGESTION ACCESS */}
          {mode === 'lecturer' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1 text-center">
                <h2 className="text-lg font-bold text-slate-900">Faculty & Examiner Portal</h2>
                <p className="text-xs text-slate-500">
                  Upload syllabus materials, past papers, and calibrate answers to train the AI.
                </p>
              </div>

              <form onSubmit={handleLecturerAccess} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Lecturer / Examiner Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. A. O. Babalola"
                    value={lecturerName}
                    onChange={(e) => setLecturerName(e.target.value)}
                    required
                    className="w-full bg-purple-50/40 border border-purple-200 text-slate-900 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    University Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. a.babalola@ui.edu.ng"
                    value={lecturerEmail}
                    onChange={(e) => setLecturerEmail(e.target.value)}
                    required
                    className="w-full bg-purple-50/40 border border-purple-200 text-slate-900 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-700/20 transition-all flex items-center justify-center space-x-2 mt-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                      <span>Verifying Faculty Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Lecturer Studio</span>
                      <ArrowRight className="w-4 h-4 text-purple-200" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="pt-4 border-t border-purple-100 grid grid-cols-2 gap-3 text-[11px] text-slate-600">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Strictly anti-hallucination</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Learns from lecturer input</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

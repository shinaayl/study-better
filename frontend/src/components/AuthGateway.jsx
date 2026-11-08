import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Database, UploadCloud, CheckCircle2, 
  ArrowRight, ShieldCheck, UserCheck, BookOpen, Sparkles, 
  User, CheckSquare, Layers, Award, Loader2, Info, Lock, ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';

export default function AuthGateway({ onUserAuthenticated }) {
  // Phase: 'signin' (Google Sign In) | 'onboarding' (Select Role & Department)
  const [phase, setPhase] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Verified Google account information (from Google OAuth or input)
  const [googleUser, setGoogleUser] = useState({
    name: '',
    email: '',
    picture: '',
    googleId: ''
  });

  // Onboarding parameters
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' | 'lecturer' | 'admin'
  const [department, setDepartment] = useState('Computer Science');
  const [institution, setInstitution] = useState('University of Ibadan');
  const [level, setLevel] = useState('300'); // for student
  const [title, setTitle] = useState('Course Lecturer & Examiner'); // for lecturer

  // System settings for Google Client ID
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
      .catch((err) => console.log('Notice: using dev google auth flow'));
  }, []);

  // Callback when real Google GIS token is received
  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.googleLogin({ credential: response.credential });
      if (res.needs_onboarding) {
        setGoogleUser(res.google_profile);
        setPhase('onboarding');
      } else if (res.user) {
        localStorage.setItem('ai_study_user', JSON.stringify(res.user));
        onUserAuthenticated(res.user);
      }
    } catch (err) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick Sign In for Development & Testing (One-click University Auth)
  const handleDevGoogleLogin = async (presetRole = 'student') => {
    setLoading(true);
    setError('');

    const isStudent = presetRole === 'student';
    const sampleProfile = {
      name: isStudent ? 'Tobi Adeleke' : 'Dr. A. O. Babalola',
      email: isStudent ? 't.adeleke@ui.edu.ng' : 'a.babalola@ui.edu.ng',
      role: presetRole,
      is_faculty: !isStudent,
      department: 'Computer Science',
      institution: 'University of Ibadan',
      level: isStudent ? '300' : undefined,
      title: !isStudent ? 'Senior Lecturer & Chief Examiner' : 'Undergraduate Student',
      picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(isStudent ? 'Tobi Adeleke' : 'Dr. Babalola')}`
    };

    try {
      const res = await api.googleLogin(sampleProfile);
      const user = res.user || sampleProfile;
      localStorage.setItem('ai_study_user', JSON.stringify(user));
      onUserAuthenticated(user);
    } catch (err) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  // Handle custom Google Email/Name entry to simulate Google OAuth
  const handleInitiateGoogleAuth = (e) => {
    e.preventDefault();
    if (!googleUser.email || !googleUser.name) {
      setError('Please provide your name and Google email address.');
      return;
    }
    setError('');
    setPhase('onboarding');
  };

  // Submit Final Role & Department Onboarding
  const handleCompleteOnboarding = async (e) => {
    e.preventDefault();
    if (!department.trim()) {
      setError('Please specify your academic department.');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      name: googleUser.name.trim(),
      email: googleUser.email.trim(),
      role: selectedRole,
      is_faculty: selectedRole === 'lecturer' || selectedRole === 'admin',
      department: department.trim(),
      institution: institution.trim() || 'University of Ibadan',
      level: selectedRole === 'student' ? level : undefined,
      title: selectedRole === 'lecturer' ? title.trim() : (selectedRole === 'admin' ? 'Faculty Administrator' : 'Undergraduate Student'),
      picture: googleUser.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(googleUser.name.trim())}`
    };

    try {
      const res = await api.completeOnboarding(payload);
      const user = res.user || payload;
      localStorage.setItem('ai_study_user', JSON.stringify(user));
      onUserAuthenticated(user);
    } catch (err) {
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-in fade-in duration-200">
      {/* University Portal Header Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-purple-100 border border-purple-200 text-purple-900 px-4 py-1.5 rounded-full text-xs font-semibold shadow-xs">
          <GraduationCap className="w-4 h-4 text-purple-700" />
          <span>Faculty of Computing · Examination & Continuous Learning Portal</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          <span className="text-purple-700">Study Better</span> · University Revision Portal
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
          An institutional revision and rubric evaluation engine. Initial documents serve as baseline testing data; 
          the agent continuously learns from and prioritizes real-time lecturer uploads and verified marking schemes.
        </p>
      </div>

      {/* PHASE 1: UNIVERSITY PORTAL SIGN IN SCREEN */}
      {phase === 'signin' && (
        <div className="max-w-md mx-auto bg-white rounded-3xl p-7 sm:p-8 border border-purple-200/90 shadow-xl shadow-purple-900/5 space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-14 h-14 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-center mx-auto shadow-xs text-purple-700">
              <BookOpen className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 pt-2">Academic Portal Login</h2>
            <p className="text-xs text-slate-500">
              Sign in with your university Google account or institutional email
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl">
              {error}
            </div>
          )}

          {/* GIS Container (if Client ID present) */}
          <div id="googleSignInBtn" className="flex justify-center"></div>

          {/* Direct Google Profile Auth Form */}
          <form onSubmit={handleInitiateGoogleAuth} className="space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Amaka Adeyemi or Dr. S. Okafor"
                value={googleUser.name}
                onChange={(e) => setGoogleUser({ ...googleUser, name: e.target.value })}
                required
                className="w-full bg-purple-50/40 border border-purple-200 text-slate-900 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                University Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. name@ui.edu.ng or yourname@gmail.com"
                value={googleUser.email}
                onChange={(e) => setGoogleUser({ ...googleUser, email: e.target.value })}
                required
                className="w-full bg-purple-50/40 border border-purple-200 text-slate-900 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-2.5 rounded-xl shadow-md shadow-purple-700/20 transition-all flex items-center justify-center space-x-2 mt-4"
            >
              <span>Continue with Academic Identity</span>
              <ArrowRight className="w-4 h-4 text-purple-200" />
            </button>
          </form>

          {/* Quick-Test Fast Launchers for Testing */}
          <div className="pt-4 border-t border-purple-100 text-center">
            <span className="text-[11px] text-purple-900 font-semibold block mb-2 font-mono">
              ⚡ Instant University One-Click Login:
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDevGoogleLogin('student')}
                className="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-2 shadow-2xs"
              >
                <GraduationCap className="w-4 h-4 text-purple-700" />
                <span>Student View</span>
              </button>

              <button
                type="button"
                onClick={() => handleDevGoogleLogin('lecturer')}
                className="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-2 shadow-2xs"
              >
                <Database className="w-4 h-4 text-purple-700" />
                <span>Lecturer Studio</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Select Lecturer to test active learning, document upload, and answer calibration.
            </p>
          </div>
        </div>
      )}

      {/* PHASE 2: ROLE SELECTION & DEPARTMENT ONBOARDING SCREEN */}
      {phase === 'onboarding' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-7 sm:p-8 border border-purple-200/90 shadow-xl shadow-purple-900/5 space-y-6">
          <div className="flex items-center justify-between border-b border-purple-100 pb-4">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setPhase('signin')}
                className="p-1.5 text-slate-500 hover:text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
                title="Back to Sign In"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Academic Profile Setup</h2>
                <p className="text-xs text-slate-500">
                  Signing in as <span className="text-purple-700 font-semibold">{googleUser.email}</span>
                </p>
              </div>
            </div>

            <div className="w-9 h-9 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center font-bold text-xs text-purple-800">
              {googleUser.name?.[0] || 'U'}
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleCompleteOnboarding} className="space-y-5 text-xs">
            {/* Role Selection Cards */}
            <div>
              <label className="font-bold text-slate-700 block mb-2">
                Select Your Role <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Student Option */}
                <div
                  onClick={() => setSelectedRole('student')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedRole === 'student'
                      ? 'border-purple-600 bg-purple-50/80 text-slate-900 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-purple-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    {selectedRole === 'student' && (
                      <span className="bg-purple-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">🎓 Student</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    Study Chat, practice exam questions, evaluate draft answers against marking rubrics, and take mock exams.
                  </p>
                </div>

                {/* Lecturer Option */}
                <div
                  onClick={() => setSelectedRole('lecturer')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedRole === 'lecturer'
                      ? 'border-purple-600 bg-purple-50/80 text-slate-900 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-purple-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Database className="w-5 h-5" />
                    </div>
                    {selectedRole === 'lecturer' && (
                      <span className="bg-purple-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">👨‍🏫 Departmental Lecturer</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    Upload syllabi, exam papers, and marking schemes. Calibrate answers to train the AI with gold standards.
                  </p>
                </div>
              </div>
            </div>

            {/* Department & Institution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science, Economics, Law"
                  required
                  className="w-full bg-purple-50/40 border border-purple-200 text-slate-900 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Higher Institution <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. University of Ibadan, UNILAG"
                  required
                  className="w-full bg-purple-50/40 border border-purple-200 text-slate-900 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Role-Specific Details */}
            {selectedRole === 'student' ? (
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Current Academic Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-purple-50/40 border border-purple-200 text-slate-900 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:bg-white focus:outline-none"
                >
                  <option value="100">100 Level (Freshman)</option>
                  <option value="200">200 Level (Sophomore)</option>
                  <option value="300">300 Level (Penultimate)</option>
                  <option value="400">400 Level (Final Year)</option>
                  <option value="500">500 Level (Engineering/Pharmacy/Law)</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Academic Title & Designation
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Lecturer, Chief Examiner, Professor"
                  className="w-full bg-purple-50/40 border border-purple-200 text-slate-900 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:bg-white focus:outline-none"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-700/20 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                  <span>Configuring Profile & Permissions...</span>
                </>
              ) : (
                <>
                  <span>Complete Onboarding & Enter University Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

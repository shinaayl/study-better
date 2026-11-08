import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, UserCheck, GraduationCap, ArrowRight, Loader2, Database } from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ isOpen, onClose, onUserAuthenticated, currentUser }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state initialized with current user data or defaults
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [role, setRole] = useState(currentUser?.role || 'student');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [institution, setInstitution] = useState(currentUser?.institution || '');
  const [level, setLevel] = useState(currentUser?.level || '300');
  const [title, setTitle] = useState(currentUser?.title || 'Senior Lecturer & Course Examiner');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setRole(currentUser.role || 'student');
      setDepartment(currentUser.department || '');
      setInstitution(currentUser.institution || '');
      setLevel(currentUser.level || '300');
      setTitle(currentUser.title || 'Senior Lecturer & Course Examiner');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please provide your name and Google account email.');
      return;
    }
    setLoading(true);
    setError('');

    const profile = {
      name: name.trim(),
      email: email.trim(),
      role: role,
      department: department.trim() || 'General Academic Faculty',
      institution: institution.trim() || 'Higher Institution',
      level: role === 'student' ? level : undefined,
      title: role === 'lecturer' ? title.trim() : 'Undergraduate Student',
      picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`
    };

    try {
      const res = await api.googleLogin(profile);
      const user = res.user || profile;
      localStorage.setItem('ai_study_user', JSON.stringify(user));
      if (onUserAuthenticated) onUserAuthenticated(user);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3 mb-2">
            {/* Google "G" SVG */}
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold">CourseAware AI · Profile Settings</h3>
              <p className="text-xs text-slate-300">
                Update your identity, department, or switch academic role
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Role Switcher */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Your Academic Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                    role === 'student'
                      ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-sky-600" />
                  <span>🎓 Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('lecturer')}
                  className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                    role === 'lecturer'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Database className="w-4 h-4 text-indigo-600" />
                  <span>👨‍🏫 Lecturer</span>
                </button>
              </div>
            </div>

            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Samuel Okafor"
                  required
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Google Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@university.edu"
                  required
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Department & Institution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Department / Faculty</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Economics, Law, Engineering, Medicine..."
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">University / Higher Institution</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. University of Ibadan, UNILAG..."
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Role specific */}
            {role === 'student' ? (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Academic Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:outline-none font-semibold"
                >
                  <option value="100">100 Level</option>
                  <option value="200">200 Level</option>
                  <option value="300">300 Level</option>
                  <option value="400">400 Level</option>
                  <option value="500">500 Level</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Academic Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Lecturer & Examiner"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Save Profile & Enter {role === 'student' ? 'Student Portal' : 'Lecturer Portal'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

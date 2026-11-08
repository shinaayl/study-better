import React, { useState } from 'react';
import { X, User, Mail, Building, BookOpen, GraduationCap, Database, Award, ShieldCheck, LogOut, Check, Edit3, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function UserProfileModal({ isOpen, onClose, currentUser, onProfileUpdated, onLogout }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editable fields
  const [name, setName] = useState(currentUser?.name || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [institution, setInstitution] = useState(currentUser?.institution || '');
  const [level, setLevel] = useState(currentUser?.level || '300');
  const [title, setTitle] = useState(currentUser?.title || '');

  if (!isOpen || !currentUser) return null;

  const isLecturer = currentUser.role === 'lecturer';

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const updatedProfile = {
      ...currentUser,
      name: name.trim() || currentUser.name,
      department: department.trim() || currentUser.department,
      institution: institution.trim() || currentUser.institution,
      level: !isLecturer ? level : undefined,
      title: isLecturer ? title.trim() : currentUser.title,
    };

    try {
      const res = await api.googleLogin(updatedProfile);
      const user = res.user || updatedProfile;
      localStorage.setItem('ai_study_user', JSON.stringify(user));
      onProfileUpdated(user);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Header with Cover Banner */}
        <div className={`h-24 p-5 flex items-start justify-between relative ${
          isLecturer 
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white' 
            : 'bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
              {isLecturer ? '👨‍🏫 Lecturer & Examiner Account' : '🎓 University Student Account'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar & Identity Box */}
        <div className="px-6 pb-6 pt-0 space-y-5 -mt-10">
          <div className="flex items-end justify-between">
            <div className="relative">
              {currentUser.picture ? (
                <img
                  src={currentUser.picture}
                  alt={currentUser.name}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg bg-white"
                />
              ) : (
                <div className={`w-20 h-20 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold text-white ${
                  isLecturer ? 'bg-indigo-600' : 'bg-sky-600'
                }`}>
                  {currentUser.name?.[0] || (isLecturer ? 'L' : 'S')}
                </div>
              )}
              <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
                isLecturer ? 'bg-indigo-500' : 'bg-emerald-500'
              }`} title="Active Verified Profile"></span>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors flex items-center space-x-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>
          </div>

          {/* Profile Name & Badges */}
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900">{currentUser.name}</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isLecturer 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {isLecturer ? 'Course Examiner' : `${currentUser.level || '300'} Level`}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center space-x-1">
              <Mail className="w-3 h-3 text-slate-400" />
              <span>{currentUser.email}</span>
            </p>
          </div>

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl">
              {error}
            </div>
          )}

          {/* VIEW MODE: Profile Details Card */}
          {!isEditing ? (
            <div className="space-y-3 pt-1">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center space-x-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>Institution</span>
                  </span>
                  <span className="font-semibold text-slate-900">{currentUser.institution || 'Higher Institution'}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>Department / Faculty</span>
                  </span>
                  <span className="font-semibold text-slate-900">{currentUser.department || 'Academic Faculty'}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center space-x-1.5">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isLecturer ? 'Academic Designation' : 'Study Level'}</span>
                  </span>
                  <span className="font-semibold text-slate-900">
                    {isLecturer 
                      ? (currentUser.title || 'Senior Lecturer & Examiner') 
                      : `${currentUser.level || '300'} Level Undergraduate`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Anti-Hallucination Guard</span>
                  </span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                    Active & Verified
                  </span>
                </div>
              </div>

              {/* Mission context note */}
              <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 leading-relaxed">
                {isLecturer ? (
                  <span>
                    As a lecturer, you can update the agent's memory anytime by uploading past question papers and official marking guides for any course.
                  </span>
                ) : (
                  <span>
                    Your questions are answered strictly using verified departmental past papers and marking schemes uploaded by course lecturers, protecting you from generic AI hallucinations.
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  onClick={onLogout}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of Account</span>
                </button>

                <button
                  onClick={onClose}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* EDIT MODE: Edit Profile Form */
            <form onSubmit={handleSave} className="space-y-3 text-xs pt-1">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Department / Faculty</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Economics, Law, Engineering, Medicine, CS"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">University / Higher Institution</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. University of Ibadan, UNILAG, OAU"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {isLecturer ? (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Academic Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Senior Lecturer, Chief Examiner, Professor"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Study Level</label>
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
              )}

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

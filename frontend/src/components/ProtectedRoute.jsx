import React from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

/**
 * Route Guard Component for Role-Based Access Control (RBAC).
 * Enforces authentication and authorized academic roles.
 */
export default function ProtectedRoute({ 
  currentUser, 
  allowedRoles = ['student', 'lecturer', 'admin'], 
  children,
  onNavigateHome
}) {
  // 1. Unauthenticated -> Redirect to Login Gateway
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 2. Authenticated but incomplete profile -> Redirect to Onboarding
  if (currentUser.needs_onboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  // 3. Authenticated but unauthorized role -> Render RBAC Restriction Guard
  const userRole = currentUser.role || 'student';
  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-rose-200 shadow-xl text-center space-y-4 animate-in fade-in duration-200">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              RBAC Route Guard · 403 Forbidden
            </span>
            <h2 className="text-xl font-black text-slate-900 pt-1">
              Access Restricted
            </h2>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Your current account role is <strong className="capitalize text-slate-800">{userRole}</strong> ({currentUser.department || 'General Faculty'}).
            This workspace requires <strong className="text-slate-800">{allowedRoles.join(' or ')}</strong> clearance.
          </p>

          <div className="pt-2">
            <button
              onClick={() => onNavigateHome ? onNavigateHome() : window.location.assign('/chat')}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Authorized Workspace</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized -> Render protected route content
  return children;
}

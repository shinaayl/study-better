import React, { useState, useEffect } from 'react';
import { UserCheck, AlertTriangle, CheckCircle, Clock, Award, History, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function PerformanceDashboard({ selectedCourse, setActiveTab }) {
  const [history, setHistory] = useState([]);
  const [weakData, setWeakData] = useState({ weak_topics: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformance();
  }, [selectedCourse]);

  const loadPerformance = async () => {
    setLoading(true);
    try {
      const histRes = await api.getEvaluationHistory('ui-cs-demo-matric-230880');
      const weakRes = await api.getWeakAreas('ui-cs-demo-matric-230880', selectedCourse);
      setHistory(histRes.history || []);
      setWeakData(weakRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const avgScore = history.length > 0
    ? Math.round(history.reduce((acc, h) => acc + h.percentage_score, 0) / history.length)
    : 0;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-sky-500/20 rounded-xl text-sky-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Student Performance & Weak Area Diagnostics</h2>
            <p className="text-sm text-slate-300">
              Personalized evaluation records, diagnostic weakness tracking, and evidence-based study recommendations.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Student Profile</span>
            <span className="font-bold text-sky-300">Matric: 230880 · 400 Level</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
            <History className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Evaluations Completed</span>
            <p className="text-xl font-bold text-slate-800">{history.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Average Rubric Score</span>
            <p className="text-xl font-bold text-slate-800">{avgScore}%</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Weak Topics Flagged</span>
            <p className="text-xl font-bold text-slate-800">{weakData.weak_topics.length}</p>
          </div>
        </div>
      </div>

      {/* Flagged Weak Areas Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-1.5 text-rose-500" />
          Targeted Practice & Diagnostic Weak Areas
        </h3>

        {weakData.weak_topics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {weakData.weak_topics.map((w, idx) => (
              <div
                key={idx}
                className="border border-rose-200 bg-rose-50/50 rounded-xl p-4 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{w.topic}</span>
                  <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold text-[10px]">
                    {w.status}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-slate-600">
                  <span>Average Score: <strong className="text-rose-700">{w.average_score}%</strong></span>
                  <span>Attempts: <strong>{w.attempts}</strong></span>
                </div>
                <p className="text-slate-700 pt-1 font-medium leading-relaxed">
                  {w.recommendation}
                </p>
                <button
                  onClick={() => setActiveTab('evaluation')}
                  className="text-sky-600 hover:text-sky-800 font-semibold flex items-center space-x-1 pt-1 text-[11px]"
                >
                  <span>Practice this topic in Evaluation Portal</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-medium text-slate-700">No Critical Weaknesses Identified Yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Submit practice answers in the Rubric Scoring tab to establish diagnostic baseline analytics.
            </p>
          </div>
        )}
      </div>

      {/* History Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center">
            <History className="w-4 h-4 mr-1.5 text-sky-600" />
            Evaluation Attempt History
          </h3>
          <span className="text-xs text-slate-500">{history.length} attempts recorded</span>
        </div>

        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Question</th>
                  <th className="py-3 px-4">Topic</th>
                  <th className="py-3 px-4 text-center">Marks Awarded</th>
                  <th className="py-3 px-4 text-center">Percentage</th>
                  <th className="py-3 px-4">Submission Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h) => (
                  <tr key={h.evaluation_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {h.course_code}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {h.question_number}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {h.topic_tag}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {h.awarded_marks}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          h.percentage_score >= 70
                            ? 'bg-emerald-100 text-emerald-800'
                            : h.percentage_score >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {h.percentage_score}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {h.submitted_answer}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            No past evaluations recorded.
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { UserCheck, AlertTriangle, CheckCircle, Clock, Award, History, ArrowRight, BookOpen, Layers } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Institutional Top Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
              Continuous Assessment Analytics
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Undergraduate Performance Record</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Student Performance & Weak Area Diagnostics
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Personalized longitudinal evaluation history, topic-by-topic proficiency tracking, and diagnostic revision recommendations.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs shrink-0">
          <span className="text-slate-500 block text-[10px] font-semibold uppercase tracking-wider">Verified Student Matric</span>
          <span className="font-bold text-slate-900 font-mono">230880 · 400 Level Computer Science</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Evaluations Completed
            </span>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{history.length}</p>
            <span className="text-[11px] text-slate-400">Total practice attempts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Average Rubric Score
            </span>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{avgScore}%</p>
            <span className="text-[11px] text-slate-400">Marking guide attainment</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Deficit Areas Flagged
            </span>
            <p className="text-2xl font-bold text-rose-700 mt-0.5">{weakData.weak_topics.length}</p>
            <span className="text-[11px] text-rose-600 font-medium">Score &lt;65% benchmark</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Flagged Weak Areas Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-1.5 text-rose-600" />
          Targeted Practice & Diagnostic Deficit Areas
        </h3>

        {weakData.weak_topics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {weakData.weak_topics.map((w, idx) => (
              <div
                key={idx}
                className="border border-rose-200 bg-rose-50/30 rounded-xl p-4 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{w.topic}</span>
                  <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold">
                    {w.status}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-slate-600">
                  <span>Average Score: <strong className="text-rose-700 font-mono">{w.average_score}%</strong></span>
                  <span>Evaluated Attempts: <strong className="font-mono">{w.attempts}</strong></span>
                </div>
                <p className="text-slate-700 pt-0.5 font-medium leading-relaxed">
                  {w.recommendation}
                </p>
                <button
                  onClick={() => setActiveTab('eval')}
                  className="text-purple-700 hover:text-purple-900 font-semibold flex items-center space-x-1 pt-1 text-[11px] cursor-pointer"
                >
                  <span>Practice this topic in Marking Scheme Evaluator</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-600">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-bold text-slate-800">No Critical Weaknesses Identified</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              You are currently performing above the 65% proficiency benchmark on all evaluated topics.
            </p>
          </div>
        )}
      </div>

      {/* History Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900 flex items-center">
            <History className="w-4 h-4 mr-1.5 text-purple-700" />
            Evaluation Attempt History
          </h3>
          <span className="text-xs text-slate-500 font-medium">{history.length} attempts logged</span>
        </div>

        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Course</th>
                  <th className="py-3 px-4 font-semibold">Question Number</th>
                  <th className="py-3 px-4 font-semibold">Syllabus Topic</th>
                  <th className="py-3 px-4 font-semibold text-center">Awarded Marks</th>
                  <th className="py-3 px-4 font-semibold text-center">Score</th>
                  <th className="py-3 px-4 font-semibold">Submission Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h) => (
                  <tr key={h.evaluation_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {h.course_code}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {h?.question_number || 'Question'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {h.topic_tag}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900 font-mono">
                      {h.awarded_marks}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[11px] border ${
                          h.percentage_score >= 70
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : h.percentage_score >= 50
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {h.percentage_score}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
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

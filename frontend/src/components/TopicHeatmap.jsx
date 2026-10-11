import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertCircle, RefreshCw, Layers, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export default function TopicHeatmap({ selectedCourse, setSelectedCourse, setActiveTab }) {
  const [data, setData] = useState({ topics: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHeatmap();
  }, [selectedCourse]);

  const loadHeatmap = () => {
    setLoading(true);
    api.getHeatmap(selectedCourse)
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const highPriorityCount = data.topics.filter((t) => t.overdue_probability >= 0.65).length;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Topic Frequency Heatmap & Overdue Predictor</h2>
            <p className="text-sm text-slate-300">
              Historical exam recurrence distribution and probabilistic forecasting of topics likely to appear.
            </p>
          </div>
        </div>

        <button
          onClick={loadHeatmap}
          className="flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Curricular Topics Analyzed</span>
            <p className="text-xl font-bold text-slate-800">{data.topics.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Likely-to-Appear Flagged</span>
            <p className="text-xl font-bold text-slate-800">{highPriorityCount} Topics</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Exam Sessions Sampled</span>
            <p className="text-xl font-bold text-slate-800">5 Sessions</p>
          </div>
        </div>
      </div>

      {/* Heatmap Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Topic Recurrence & Overdue Distribution</h3>
          <span className="text-xs text-slate-500">
            Formula: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">P(overdue) = min(0.95, 0.40 + 0.12 * freq)</code>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Topic Area</th>
                <th className="py-3 px-4 text-center">Sessions Examined</th>
                <th className="py-3 px-4 text-center">Last Appeared</th>
                <th className="py-3 px-4">Overdue Probability</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.topics.map((t) => {
                const prob = Math.round(t.overdue_probability * 100);
                return (
                  <tr key={t.topic_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {t.course_code}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {t.topic_name}
                      <span className="block text-[11px] text-slate-400 font-normal">{t.course_title}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold">
                        {t.sessions_examined}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600">
                      {t.last_session_appeared}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-28 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full ${
                              prob >= 70
                                ? 'bg-rose-500'
                                : prob >= 55
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${prob}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800 text-xs w-9">
                          {prob}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActiveTab('chat')}
                        className="text-sky-600 hover:text-sky-800 font-medium hover:underline text-xs"
                      >
                        Study Topic &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, RefreshCw, Layers, Calendar, ArrowRight, 
  Search, Filter, BookOpen, Info, Check, HelpCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function TopicHeatmap({ selectedCourse, setSelectedCourse, setActiveTab }) {
  const [data, setData] = useState({ topics: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL'); // 'ALL' | 'HIGH' | 'MODERATE' | 'PERIODIC'
  const [courseFilter, setCourseFilter] = useState(selectedCourse || 'ALL');

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

  const topics = data.topics || [];

  // Extract unique course codes for the filter dropdown
  const uniqueCourseCodes = Array.from(new Set(topics.map((t) => t.course_code).filter(Boolean)));

  // Filter topics based on search, priority, and course
  const filteredTopics = topics.filter((t) => {
    const matchesCourse = courseFilter === 'ALL' || t.course_code === courseFilter;
    if (!matchesCourse) return false;

    const matchesSearch = 
      t.topic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.course_title && t.course_title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    const prob = t.overdue_probability;
    if (priorityFilter === 'HIGH') return prob >= 0.70;
    if (priorityFilter === 'MODERATE') return prob >= 0.55 && prob < 0.70;
    if (priorityFilter === 'PERIODIC') return prob < 0.55;
    return true;
  });

  const highPriorityCount = topics.filter((t) => t.overdue_probability >= 0.70).length;
  const avgRecurrence = topics.length > 0 
    ? (topics.reduce((acc, t) => acc + Math.min(5, t.sessions_examined || 0), 0) / topics.length).toFixed(1)
    : '0';

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
              Department of Computer Science
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Curriculum Analytics</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Exam Topic Frequency & Trend Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Historical examination recurrence distribution across five academic sessions (2019/2020 – 2023/2024). 
            Empirical frequency analysis highlights core syllabus concepts with high historical examination weights to guide revision planning.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={loadHeatmap}
            disabled={loading}
            className="flex items-center space-x-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {/* Unified Executive Summary Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block">
              Curricular Topics
            </span>
            <p className="text-2xl font-bold text-slate-900 font-mono mt-1">
              {topics.length}
            </p>
            <span className="text-[11px] text-slate-500">Indexed syllabus modules</span>
          </div>

          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block">
              Core Exam Priority (≥70%)
            </span>
            <p className="text-2xl font-bold text-slate-900 font-mono mt-1">
              {highPriorityCount}
            </p>
            <span className="text-[11px] text-slate-500">Frequently recurring topics</span>
          </div>

          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block">
              Sample Window
            </span>
            <p className="text-2xl font-bold text-slate-900 font-mono mt-1">
              5 Sessions
            </p>
            <span className="text-[11px] text-slate-500">2019/2020 – 2023/2024</span>
          </div>

          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block">
              Average Recurrence
            </span>
            <p className="text-2xl font-bold text-slate-900 font-mono mt-1">
              {avgRecurrence} <span className="text-xs text-slate-400 font-normal">/ 5 sessions</span>
            </p>
            <span className="text-[11px] text-slate-500">Mean topic appearance rate</span>
          </div>
        </div>
      </div>

      {/* Main Table Card with Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
          {/* Left: Search Input & Course Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search topic or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>

            {/* Course Filter Dropdown */}
            {uniqueCourseCodes.length > 1 && (
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800 cursor-pointer"
              >
                <option value="ALL">All Indexed Courses ({uniqueCourseCodes.length})</option>
                {uniqueCourseCodes.map((cc) => (
                  <option key={cc} value={cc}>{cc}</option>
                ))}
              </select>
            )}
          </div>

          {/* Right: Neutral Segmented Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 border border-slate-200/80 rounded-xl p-1 text-xs self-start lg:self-auto">
            <button
              onClick={() => setPriorityFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                priorityFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Topics ({topics.length})
            </button>
            <button
              onClick={() => setPriorityFilter('HIGH')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                priorityFilter === 'HIGH'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Core Focus (≥70%)
            </button>
            <button
              onClick={() => setPriorityFilter('MODERATE')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                priorityFilter === 'MODERATE'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rotational (55–69%)
            </button>
            <button
              onClick={() => setPriorityFilter('PERIODIC')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                priorityFilter === 'PERIODIC'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Periodic (&lt;55%)
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Syllabus Topic Area</th>
                <th className="py-3 px-4">Historical Recurrence</th>
                <th className="py-3 px-4 text-center">Last Examined</th>
                <th className="py-3 px-4">Exam Frequency Weight</th>
                <th className="py-3 px-4 text-right">Study Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTopics.length > 0 ? (
                filteredTopics.map((t) => {
                  const prob = Math.round(t.overdue_probability * 100);
                  const isHigh = prob >= 70;
                  const isMod = prob >= 55 && prob < 70;
                  const examinedCount = Math.min(5, t.sessions_examined || 0);

                  return (
                    <tr key={t.topic_id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Course */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded text-xs border border-slate-200">
                          {t.course_code}
                        </span>
                      </td>

                      {/* Topic Name */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <span className="font-semibold text-slate-900 block text-xs">
                          {t.topic_name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal block mt-0.5 truncate">
                          {t.course_title}
                        </span>
                      </td>

                      {/* Discrete 5-Session Grid Indicator */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((tick) => {
                            const isFilled = tick <= examinedCount;
                            return (
                              <div
                                key={tick}
                                className={`w-3.5 h-1.5 rounded-xs transition-colors ${
                                  isFilled ? 'bg-slate-800' : 'bg-slate-200'
                                }`}
                                title={`Session ${tick} appearance`}
                              />
                            );
                          })}
                          <span className="font-mono text-xs font-semibold text-slate-700 ml-1.5">
                            {examinedCount}/5
                          </span>
                        </div>
                      </td>

                      {/* Last Session Examined */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-700">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          {t.last_session_appeared || 'Historical'}
                        </span>
                      </td>

                      {/* Exam Frequency Weight */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] w-36">
                            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                isHigh ? 'bg-slate-900' : isMod ? 'bg-slate-500' : 'bg-slate-300'
                              }`} />
                              {isHigh ? 'Core Priority' : isMod ? 'Rotational' : 'Periodic'}
                            </span>
                            <span className="font-mono font-bold text-slate-900">{prob}%</span>
                          </div>
                          <div className="w-36 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-slate-800 transition-all duration-300"
                              style={{ width: `${prob}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            if (setSelectedCourse) setSelectedCourse(t.course_code);
                            if (setActiveTab) setActiveTab('chat');
                          }}
                          className="inline-flex items-center space-x-1 text-xs font-medium text-slate-700 hover:text-purple-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        >
                          <span>Review Questions</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400">
                    <p className="text-xs">No topics matched the selected filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Methodology Note */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Methodology Note:</strong> Examination frequency weights are computed by aggregating question tags across five consecutive academic sessions in the departmental repository. 
            Core curriculum modules recurring across multiple sessions reflect high-priority continuous assessment and semester degree examination standards.
          </p>
        </div>
      </div>
    </div>
  );
}

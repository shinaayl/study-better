import React, { useState } from 'react';
import { FileText, Sparkles, Clock, CheckSquare, Loader2, Award, ChevronRight } from 'lucide-react';
import { api } from '../services/api';

export default function MockExamView({ courses, selectedCourse, setSelectedCourse, setActiveTab }) {
  const [exam, setExam] = useState(null);
  const [numQuestions, setNumQuestions] = useState(3);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    const targetCourse = selectedCourse || 'CSC 321';
    setGenerating(true);
    try {
      const res = await api.generateMockExam(targetCourse, numQuestions);
      setExam(res);
    } catch (err) {
      console.error(err);
      alert('Failed to generate mock exam.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Configuration Strip */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-sky-600" />
            UI Past-Paper Style Mock Exam Generator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-assembles realistic practice examinations matching UI Computer Science paper standards.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs text-slate-700">
            <span className="font-medium">Questions:</span>
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs"
            >
              <option value={2}>2 Questions</option>
              <option value={3}>3 Questions</option>
              <option value={4}>4 Questions</option>
              <option value={5}>5 Questions</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-sky-600/20 transition-all"
          >
            {generating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Assembling Paper...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Exam</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Paper View */}
      {exam ? (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-lg overflow-hidden animate-in fade-in duration-300">
          {/* Institutional Examination Header */}
          <div className="bg-slate-900 text-white p-6 text-center border-b border-slate-800 space-y-1.5">
            <h1 className="text-base font-extrabold tracking-wider uppercase text-slate-100">
              {exam.institution}
            </h1>
            <h2 className="text-xs font-bold tracking-widest uppercase text-sky-400">
              {exam.faculty} · {exam.department}
            </h2>
            <h3 className="text-sm font-semibold text-slate-300 pt-1">
              B.SC. DEGREE PRACTICE EXAMINATION ({exam.session})
            </h3>
            <div className="inline-block bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg text-xs font-mono text-sky-300 mt-1">
              {exam.course_code}: {exam.course_title}
            </div>
            <div className="flex items-center justify-center space-x-6 pt-3 text-xs text-slate-400 border-t border-slate-800/80 mt-3">
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" /> 2 Hours
              </span>
              <span className="flex items-center">
                <Award className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Total Marks: {exam.total_marks}
              </span>
            </div>
            <p className="text-[11px] text-amber-300/90 font-mono tracking-tight pt-1">
              {exam.instructions}
            </p>
          </div>

          {/* Exam Questions Body */}
          <div className="p-6 space-y-6 divide-y divide-slate-100">
            {exam.questions.map((q, idx) => (
              <div key={idx} className="pt-6 first:pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">
                      Question {idx + 1} ({q.question_number})
                    </span>
                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                      Session {q.academic_year || 'Historical'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded">
                      Bloom: {q.bloom_level}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded">
                      {q.total_marks} Marks
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {q.question_text}
                </p>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 text-[11px]">
                    Topic Tag: <strong className="text-slate-700">{q.topic_tag}</strong>
                  </span>
                  <button
                    onClick={() => setActiveTab('evaluation')}
                    className="text-sky-600 hover:text-sky-800 font-semibold flex items-center space-x-1 hover:underline text-xs"
                  >
                    <span>Practice & Grade Answer in Evaluation Portal</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <FileText className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="text-sm font-semibold text-slate-600">No Mock Examination Generated Yet</h3>
          <p className="text-xs max-w-sm mx-auto">
            Choose your desired question count above and click "Generate Exam" to generate a practice paper tailored to your chosen course.
          </p>
        </div>
      )}
    </div>
  );
}

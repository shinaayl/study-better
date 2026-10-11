import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Award, BookOpen, Send, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function EvaluationPortal({ courses, selectedCourse, setSelectedCourse }) {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  // Load questions when course changes
  useEffect(() => {
    const courseToFetch = selectedCourse || 'CSC 321';
    setLoadingQuestions(true);
    api.getCourseQuestions(courseToFetch)
      .then((data) => {
        setQuestions(data.questions || []);
        if (data.questions && data.questions.length > 0) {
          setSelectedQuestion(data.questions[0]);
        } else {
          setSelectedQuestion(null);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingQuestions(false));
  }, [selectedCourse]);

  const handleSelectQuestion = (qId) => {
    const found = questions.find((q) => q.question_id === qId);
    if (found) {
      setSelectedQuestion(found);
      setEvaluationResult(null);
    }
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!studentAnswer.trim() || evaluating) return;

    setEvaluating(true);
    try {
      const payload = {
        student_answer: studentAnswer,
        question_id: selectedQuestion ? selectedQuestion.question_id : undefined,
        question_text: selectedQuestion ? selectedQuestion.question_text : customQuestionText,
        course_code: selectedCourse || (selectedQuestion ? 'CSC 321' : 'CSC'),
        student_id: 'ui-cs-demo-matric-230880'
      };
      const result = await api.submitEvaluation(payload);
      setEvaluationResult(result);
    } catch (err) {
      console.error(err);
      alert('Error evaluating answer against marking scheme.');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-sky-500/20 rounded-xl text-sky-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Automated Rubric Evaluation Engine</h2>
            <p className="text-sm text-slate-300">
              Submit your draft answers to receive point-by-point scoring against official University of Ibadan marking schemes.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Question Selection & Answer Form */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                <BookOpen className="w-4 h-4 mr-1.5 text-sky-600" />
                Select Departmental Question
              </label>
              <span className="text-xs text-slate-500">
                {questions.length} questions available
              </span>
            </div>

            {loadingQuestions ? (
              <div className="flex items-center space-x-2 text-xs text-slate-500 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                <span>Loading past questions...</span>
              </div>
            ) : (
              <select
                value={selectedQuestion ? selectedQuestion.question_id : ''}
                onChange={(e) => handleSelectQuestion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              >
                {questions.map((q) => (
                  <option key={q.question_id} value={q.question_id}>
                    {q.question_number} · [{q.total_marks} Marks] · {q.academic_year} · {q.question_text.slice(0, 75)}...
                  </option>
                ))}
              </select>
            )}

            {/* Selected Question Details Card */}
            {selectedQuestion && (
              <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-900 bg-sky-200/60 px-2 py-0.5 rounded">
                    {selectedQuestion.question_number} ({selectedQuestion.academic_year})
                  </span>
                  <div className="flex space-x-2">
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                      {selectedQuestion.bloom_level}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                      {selectedQuestion.total_marks} Marks
                    </span>
                  </div>
                </div>
                <p className="text-slate-800 font-medium leading-relaxed">
                  {selectedQuestion.question_text}
                </p>
                <div className="text-[11px] text-slate-500">
                  Topic: <span className="font-mono text-slate-700">{selectedQuestion.topic_tag}</span>
                </div>
              </div>
            )}

            {/* Answer Text Area */}
            <form onSubmit={handleEvaluate} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Your Draft Answer
                </label>
                <textarea
                  rows={8}
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                  placeholder="Type or paste your complete technical answer here... Include necessary definitions, technical terms, algorithms, and derivations."
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  {studentAnswer.split(/\s+/).filter(Boolean).length} words
                </span>
                <button
                  type="submit"
                  disabled={evaluating || !studentAnswer.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-md shadow-emerald-600/20 transition-all"
                >
                  {evaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Grading against Marking Scheme...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Evaluate Against Rubric</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Scoring Breakdown Card */}
        <div className="lg:col-span-5 space-y-4">
          {evaluationResult ? (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5 animate-in fade-in duration-300">
              {/* Score Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    Graded Score
                  </span>
                  <div className="flex items-baseline space-x-1.5 mt-0.5">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {evaluationResult.awarded_marks}
                    </span>
                    <span className="text-slate-500 font-medium text-sm">
                      / {evaluationResult.total_marks} Marks
                    </span>
                  </div>
                </div>

                <div
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm ${
                    evaluationResult.percentage_score >= 70
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : evaluationResult.percentage_score >= 50
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {evaluationResult.percentage_score}%
                </div>
              </div>

              {/* Qualitative Feedback */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-1 flex items-center">
                  <Award className="w-3.5 h-3.5 mr-1 text-sky-600" />
                  Examiner Assessment Note:
                </span>
                {evaluationResult.qualitative_feedback}
              </div>

              {/* Step-by-Step Rubric Criteria Breakdown */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">
                  Mark-by-Mark Rubric Breakdown
                </label>

                <div className="space-y-2">
                  {evaluationResult.criteria_breakdown.map((crit, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-100 bg-slate-50/50 rounded-xl p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-800 line-clamp-2">
                          {crit.criterion}
                        </span>
                        <span className="font-mono font-bold text-slate-700 shrink-0 ml-2">
                          {crit.awarded_marks} / {crit.allocated_marks}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            crit.status === 'FULL_CREDIT'
                              ? 'bg-emerald-100 text-emerald-700'
                              : crit.status === 'PARTIAL_CREDIT'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {crit.status}
                        </span>
                        <p className="text-[11px] text-slate-500">{crit.evaluator_note}</p>
                      </div>

                      {crit.matched_keywords && crit.matched_keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {crit.matched_keywords.map((kw, kIdx) => (
                            <span
                              key={kIdx}
                              className="bg-sky-100 text-sky-800 text-[10px] px-1.5 py-0.2 rounded font-mono"
                            >
                              ✓ {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 space-y-3">
              <Award className="w-10 h-10 mx-auto text-slate-300" />
              <h3 className="text-sm font-semibold text-slate-600">No Evaluation Submitted Yet</h3>
              <p className="text-xs max-w-xs mx-auto">
                Select a past examination question from the left, write your draft response, and click "Evaluate Against Rubric".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

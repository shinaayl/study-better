import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, AlertTriangle, XCircle, Award, BookOpen, 
  Send, Loader2, ArrowRight, Check, HelpCircle, 
  Layers, ChevronDown, Filter, FileText, ClipboardCheck,
  Scale, AlertCircle, Bookmark, CheckSquare
} from 'lucide-react';
import { api } from '../services/api';

export default function EvaluationPortal({ courses, selectedCourse, setSelectedCourse }) {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  const activeCourseCode = selectedCourse || (courses && courses.length > 0 ? courses[0].course_code : 'CSC 321');

  // Load questions when course changes
  useEffect(() => {
    setLoadingQuestions(true);
    setEvaluationResult(null);
    api.getCourseQuestions(activeCourseCode)
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
  }, [activeCourseCode]);

  const handleSelectQuestion = (qId) => {
    const found = questions.find((q) => q.question_id === qId);
    if (found) {
      setSelectedQuestion(found);
      setEvaluationResult(null);
    }
  };

  const handleCourseChange = (newCode) => {
    if (setSelectedCourse) {
      setSelectedCourse(newCode);
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
        course_code: activeCourseCode,
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

  const wordCount = studentAnswer.split(/\s+/).filter(Boolean).length;
  const charCount = studentAnswer.length;

  // Academic degree grade classification (University of Ibadan standard)
  const getDegreeClassification = (pct) => {
    if (pct >= 70) return { label: 'First Class Standard (A)', color: 'text-emerald-800 bg-emerald-50 border-emerald-300' };
    if (pct >= 60) return { label: 'Second Class Upper (B)', color: 'text-sky-800 bg-sky-50 border-sky-300' };
    if (pct >= 50) return { label: 'Second Class Lower (C)', color: 'text-amber-800 bg-amber-50 border-amber-300' };
    if (pct >= 45) return { label: 'Third Class Standard (D)', color: 'text-orange-800 bg-orange-50 border-orange-300' };
    if (pct >= 40) return { label: 'Pass Standard (E)', color: 'text-slate-800 bg-slate-100 border-slate-300' };
    return { label: 'Unsatisfactory / Fail (F)', color: 'text-rose-800 bg-rose-50 border-rose-300' };
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Institutional Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
              Department of Computer Science
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Official Examination Evaluation Suite</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Automated Marking Scheme & Rubric Evaluator
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Test draft student responses against verified departmental marking guides. 
            The evaluator verifies required technical vocabulary, evaluates structural steps, and produces an itemized mark breakdown showing points awarded and deductions applied.
          </p>
        </div>

        {/* Quick Course Selector */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shrink-0 sm:min-w-60">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block mb-1">
            Active Course Syllabus
          </label>
          <select
            value={activeCourseCode}
            onChange={(e) => handleCourseChange(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-semibold rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none cursor-pointer"
          >
            {courses && courses.map((c) => (
              <option key={c.course_id || c.course_code} value={c.course_code}>
                {c.course_code} — {c.course_title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Question Selection & Draft Editor */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            {/* Question Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                  <BookOpen className="w-4 h-4 mr-1.5 text-purple-700" />
                  Select Examination Past Question
                </label>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                  {questions.length} questions indexed
                </span>
              </div>

              {loadingQuestions ? (
                <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 py-4 bg-slate-50 rounded-xl border border-slate-200">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span>Loading departmental past questions...</span>
                </div>
              ) : questions.length > 0 ? (
                <select
                  value={selectedQuestion ? selectedQuestion.question_id : ''}
                  onChange={(e) => handleSelectQuestion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium cursor-pointer"
                >
                  {questions.map((q) => (
                    <option key={q?.question_id || Math.random()} value={q?.question_id}>
                      {q?.question_number || 'Question'} · [{q?.total_marks || 0} Marks] · {q?.academic_year || 'Historical'} · {q?.question_text ? q.question_text.slice(0, 75) + '...' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  No indexed questions found for <strong>{activeCourseCode}</strong> yet. You may enter a question prompt manually.
                </div>
              )}
            </div>

            {/* Selected Question Details Card */}
            {selectedQuestion && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 font-mono">
                      {selectedQuestion?.question_number || 'Question'}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">
                      Session {selectedQuestion?.academic_year || 'Departmental Archive'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedQuestion?.bloom_level && (
                      <span className="bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                        {selectedQuestion.bloom_level}
                      </span>
                    )}
                    <span className="bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 rounded font-bold text-[11px]">
                      {selectedQuestion?.total_marks || 0} Marks
                    </span>
                  </div>
                </div>

                <p className="text-slate-800 font-medium leading-relaxed pt-0.5">
                  {selectedQuestion?.question_text || ''}
                </p>

                <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/80 flex items-center justify-between">
                  <span>Topic Syllabus: <strong className="text-slate-800">{selectedQuestion?.topic_tag || 'General'}</strong></span>
                  <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">Official Marking Guide Ready</span>
                </div>
              </div>
            )}

            {/* Answer Text Area & Submission Form */}
            <form onSubmit={handleEvaluate} className="space-y-3 pt-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Student Draft Response
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {wordCount} words · {charCount} chars
                  </span>
                </div>
                <textarea
                  rows={9}
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                  placeholder="Draft your solution here. Present formal technical definitions, formulas or diagrams, step-by-step intermediate mechanisms, and canonical departmental terminology..."
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-purple-600 font-sans leading-relaxed shadow-2xs"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 flex items-center">
                  <Scale className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  Evaluated against official faculty criteria
                </span>
                <button
                  type="submit"
                  disabled={evaluating || !studentAnswer.trim()}
                  className="bg-purple-700 hover:bg-purple-800 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  {evaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Grading Against Marking Scheme...</span>
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="w-4 h-4" />
                      <span>Grade Against Marking Scheme</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Examiner Mark Sheet & Feedback */}
        <div className="lg:col-span-6 space-y-4">
          {evaluationResult ? (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
              {/* Score Header */}
              <div className="border-b border-slate-200 pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Examiner Assessment Report
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                      {evaluationResult.course_code} · {evaluationResult.question_number}
                    </h3>
                  </div>

                  {/* Degree Grade Tag */}
                  {(() => {
                    const grade = getDegreeClassification(evaluationResult.percentage_score);
                    return (
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${grade.color}`}>
                        {grade.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Score Tally Summary */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-semibold uppercase text-slate-500 block">
                      Marks Awarded
                    </span>
                    <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                      {evaluationResult.awarded_marks}
                    </p>
                    <span className="text-[10px] text-slate-500">out of {evaluationResult.total_marks}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-semibold uppercase text-slate-500 block">
                      Percentage Score
                    </span>
                    <p className="text-xl font-bold text-purple-700 font-mono mt-0.5">
                      {evaluationResult.percentage_score}%
                    </p>
                    <span className="text-[10px] text-slate-500">attainment rate</span>
                  </div>

                  <div className={`border rounded-xl p-3 text-center ${
                    (evaluationResult.marks_lost || 0) > 0 ? 'bg-rose-50/70 border-rose-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className={`text-[10px] font-semibold uppercase block ${
                      (evaluationResult.marks_lost || 0) > 0 ? 'text-rose-700' : 'text-slate-500'
                    }`}>
                      Marks Deducted
                    </span>
                    <p className={`text-xl font-bold font-mono mt-0.5 ${
                      (evaluationResult.marks_lost || 0) > 0 ? 'text-rose-700' : 'text-slate-700'
                    }`}>
                      -{(evaluationResult.marks_lost !== undefined 
                          ? evaluationResult.marks_lost 
                          : Math.max(0, evaluationResult.total_marks - evaluationResult.awarded_marks)).toFixed(1)}
                    </p>
                    <span className="text-[10px] text-slate-500">deduction penalty</span>
                  </div>
                </div>
              </div>

              {/* Qualitative Feedback */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-1">
                  Examiner Feedback Summary:
                </span>
                <p>{evaluationResult.qualitative_feedback}</p>
              </div>

              {/* Step-by-Step Marking Criteria Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Point-by-Point Marking Scheme Checklist
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {evaluationResult.criteria_breakdown.length} steps evaluated
                  </span>
                </div>

                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {evaluationResult.criteria_breakdown.map((crit, idx) => {
                    const isDeficient = crit.status === 'DEFICIENT';
                    const isPartial = crit.status === 'PARTIAL_CREDIT';
                    const isFull = crit.status === 'FULL_CREDIT' || crit.status === 'PASS';
                    const deduction = crit.marks_lost !== undefined 
                      ? crit.marks_lost 
                      : Math.max(0, crit.allocated_marks - crit.awarded_marks);

                    return (
                      <div
                        key={idx}
                        className={`border rounded-xl p-3 text-xs space-y-2 transition-all ${
                          isDeficient
                            ? 'border-rose-200 bg-rose-50/20'
                            : isPartial
                            ? 'border-amber-200 bg-amber-50/20'
                            : 'border-slate-200 bg-slate-50/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-semibold text-slate-900 leading-snug">
                            {crit.criterion}
                          </span>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {crit.awarded_marks} / {crit.allocated_marks} M
                            </span>
                            {deduction > 0 && (
                              <span className="text-[10px] font-bold text-rose-700 block">
                                -{deduction.toFixed(1)} lost
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Label */}
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              isFull
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : isPartial
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {crit.status.replace(/_/g, ' ')}
                          </span>

                          <span className="text-[11px] text-slate-600">
                            {crit.evaluator_note}
                          </span>
                        </div>

                        {/* Recognized Keywords */}
                        {crit.matched_keywords && crit.matched_keywords.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            <span className="text-[10px] font-semibold text-slate-500">Credited Terms:</span>
                            {crit.matched_keywords.map((kw, kIdx) => (
                              <span
                                key={kIdx}
                                className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] px-1.5 py-0.5 rounded font-mono"
                              >
                                ✓ {kw}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Missing Keywords */}
                        {crit.missing_keywords && crit.missing_keywords.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            <span className="text-[10px] font-semibold text-rose-700">Missing Concepts:</span>
                            {crit.missing_keywords.map((kw, kIdx) => (
                              <span
                                key={kIdx}
                                className="bg-rose-50 text-rose-800 border border-rose-200 text-[10px] px-1.5 py-0.5 rounded font-mono"
                              >
                                ✗ {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center text-slate-500 space-y-4 shadow-xs">
              <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mx-auto border border-slate-200">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="text-sm font-bold text-slate-800">
                  Examiner Marking Sheet Pending
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Select an authentic past question on the left, type or paste your drafted answer, and click <strong>"Grade Against Marking Scheme"</strong> to receive an itemized criteria report.
                </p>
              </div>

              {/* Sample Criteria Preview */}
              <div className="pt-2 max-w-sm mx-auto border-t border-slate-100 text-left text-[11px] text-slate-500 space-y-1.5">
                <span className="font-semibold text-slate-700 block uppercase tracking-wider text-[10px]">
                  What the evaluator checks:
                </span>
                <div className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Presence of canonical definitions & technical terms</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Step-by-step intermediate mechanisms & derivations</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Mark deduction penalties for common examination pitfalls</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

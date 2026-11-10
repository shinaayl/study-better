import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  Send, Bot, User, Copy, Check, BookOpen, Layers, 
  ChevronDown, ChevronUp, Sparkles, RefreshCw, FileText, 
  Square, GraduationCap, ShieldCheck, ArrowRight, CornerDownLeft,
  FileSpreadsheet, CheckCircle2, Star, Flag, X, AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';

// Code block component with copy-to-clipboard functionality
function CodeBlock({ node, inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeText = String(children).replace(/\n$/, '');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="relative my-3 rounded-xl overflow-hidden border border-purple-200/80 bg-slate-900 shadow-md">
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/90 text-slate-300 text-[11px] font-mono border-b border-slate-700/50">
          <span className="font-semibold text-purple-300 uppercase">{language}</span>
          <button
            onClick={handleCopyCode}
            className="flex items-center space-x-1 hover:text-white transition-colors bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 px-2 py-0.5 rounded text-[10px] cursor-pointer"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-3.5 text-xs text-slate-100 font-mono overflow-x-auto leading-relaxed">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  }

  return (
    <code className="bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded text-[11px] font-mono border border-purple-200/80" {...props}>
      {children}
    </code>
  );
}

// Collapsible Sources & Rubrics Component (White and Light Purple Theme)
function SourcesBadge({ sources, course }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSnippet, setExpandedSnippet] = useState(null);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-2.5 border-t border-purple-100">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-purple-50/80 hover:bg-purple-100/80 rounded-xl border border-purple-200/80 text-left transition-colors group cursor-pointer"
      >
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-purple-600 shrink-0" />
          <span className="font-semibold text-xs text-purple-900">
            Sources & Rubrics Used
          </span>
          <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full font-bold">
            {sources.length} {sources.length === 1 ? 'Reference' : 'References'}
          </span>
        </div>
        <div className="flex items-center space-x-1 text-purple-700 text-[11px]">
          <span className="text-[10px] text-purple-600 hidden sm:inline font-medium">
            {isOpen ? 'Collapse' : 'Inspect Pages & Rubrics'}
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-purple-600 transition-transform" />
          ) : (
            <ChevronDown className="w-4 h-4 text-purple-600 transition-transform" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="mt-2.5 space-y-2 p-2.5 bg-purple-50/40 border border-purple-100 rounded-2xl animate-in fade-in duration-150">
          <div className="text-[10px] font-medium text-purple-700 px-1 flex items-center justify-between">
            <span>Verified Institutional Documents (ChromaDB Dense Vectors)</span>
            {course && (
              <span className="text-purple-900 font-semibold">{course.course_code || ''}</span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            {sources.map((src, i) => {
              const docTypeLabel = (src.doc_type || 'material').replace(/_/g, ' ');
              const isMarkingScheme = docTypeLabel.toLowerCase().includes('marking');
              const isPastExam = docTypeLabel.toLowerCase().includes('exam') || docTypeLabel.toLowerCase().includes('question');

              return (
                <div
                  key={src.chunk_id || i}
                  className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs text-xs space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate text-[11px]" title={src.document_title || src.source_filename}>
                        {src.document_title || src.source_filename}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        Page {src.page_number || 1}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        isMarkingScheme 
                          ? 'bg-amber-50 text-amber-800 border-amber-200' 
                          : isPastExam 
                          ? 'bg-sky-50 text-sky-800 border-sky-200' 
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {docTypeLabel.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span>
                      Course: <strong className="text-purple-900">{src.course_code || 'General'}</strong> · Session: <strong>{src.academic_year || 'Historical'}</strong>
                    </span>
                    <button
                      onClick={() => setExpandedSnippet(expandedSnippet === i ? null : i)}
                      className="text-purple-600 hover:text-purple-800 font-semibold underline cursor-pointer"
                    >
                      {expandedSnippet === i ? 'Hide Excerpt' : 'View Chunk Excerpt'}
                    </button>
                  </div>

                  {expandedSnippet === i && src.snippet && (
                    <div className="mt-1.5 p-2.5 bg-purple-50/50 rounded-lg border border-purple-100 text-[11px] font-mono text-purple-950 leading-relaxed max-h-32 overflow-y-auto">
                      {src.snippet}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatInterface({ currentUser, initialPrompt, selectedCourse, setSelectedCourse }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courses, setCourses] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  const activeCourseCode = typeof selectedCourse === 'string'
    ? selectedCourse
    : (selectedCourse?.course_code || '');

  // Quality Control & Lecturer Feedback Loop State
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [activeFeedbackMsg, setActiveFeedbackMsg] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [isHallucination, setIsHallucination] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [correctedAnswer, setCorrectedAnswer] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccessToast, setFeedbackSuccessToast] = useState('');

  const handleOpenFeedback = (msg) => {
    setActiveFeedbackMsg(msg);
    setFeedbackRating(5);
    setIsHallucination(false);
    setFeedbackNotes('');
    setCorrectedAnswer('');
    setFeedbackSuccessToast('');
    setFeedbackModalOpen(true);
  };

  const handleSubmitFeedback = async () => {
    if (!activeFeedbackMsg) return;
    setSubmittingFeedback(true);
    try {
      const courseCode = activeFeedbackMsg.course?.course_code || activeCourseCode || 'CSC 321';
      const msgIdx = messages.findIndex(m => m.id === activeFeedbackMsg.id);
      const queryText = (msgIdx > 0 && messages[msgIdx - 1]?.sender === 'user') 
        ? messages[msgIdx - 1].text 
        : 'Student Query';

      await api.submitFeedback({
        lecturer_email: currentUser?.email || 'student@ui.edu.ng',
        lecturer_name: currentUser?.name || 'Academic Reviewer',
        course_code: courseCode,
        target_type: 'qa_answer',
        target_id: activeFeedbackMsg.guardrail?.log_id || activeFeedbackMsg.id,
        query_text: queryText,
        ai_response: activeFeedbackMsg.text,
        rating: feedbackRating,
        faithfulness_score: activeFeedbackMsg.guardrail?.faithfulness_score || 1.0,
        is_hallucination: isHallucination,
        feedback_notes: feedbackNotes,
        corrected_answer: correctedAnswer.trim() ? correctedAnswer.trim() : null
      });

      setFeedbackSuccessToast(
        correctedAnswer.trim()
          ? 'Solution calibrated into knowledge base!'
          : 'Thank you! Feedback recorded.'
      );
      setTimeout(() => {
        setFeedbackModalOpen(false);
        setFeedbackSuccessToast('');
      }, 1500);
    } catch (err) {
      console.error('Feedback submission error:', err);
      alert('Failed to submit feedback: ' + err.message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    api.getCourses()
      .then((res) => {
        const list = res.courses || [];
        setCourses(list);
      })
      .catch((err) => console.error('Error fetching courses:', err));
  }, []);

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  const handleSend = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const botMsgId = (Date.now() + 1).toString();
    const botMsg = {
      id: botMsgId,
      sender: 'bot',
      text: '',
      sources: [],
      course: null,
      isStreaming: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    const conversationHistory = messages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    try {
      await api.streamChatQuery({
        student_message: textToSend,
        course_id: null, // Let agent memory dynamically detect and resolve course context
        conversation_history: conversationHistory,
        signal: abortController.signal,
        onSources: (sources, course) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMsgId
                ? { ...msg, sources: sources || [], course: course || msg.course }
                : msg
            )
          );
        },
        onDelta: (deltaText) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMsgId
                ? { ...msg, text: msg.text + deltaText }
                : msg
            )
          );
        },
        onGuardrail: (guardrailData) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMsgId
                ? { ...msg, guardrail: guardrailData }
                : msg
            )
          );
        },
        onDone: (doneData) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMsgId
                ? { 
                    ...msg, 
                    isStreaming: false,
                    text: msg.text || (doneData && doneData.full_text) || '',
                    guardrail: (doneData && doneData.guardrail) || msg.guardrail
                  }
                : msg
            )
          );
          setLoading(false);
          abortControllerRef.current = null;
        },
        onError: (err) => {
          console.error('Chat stream error:', err);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMsgId
                ? { 
                    ...msg, 
                    isStreaming: false, 
                    text: msg.text || "Apologies, an error occurred while streaming response from the Gemini RAG query engine. Please check backend connection." 
                  }
                : msg
            )
          );
          setLoading(false);
          abortControllerRef.current = null;
        }
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId
              ? { 
                  ...msg, 
                  isStreaming: false, 
                  text: "Connection error: Unable to communicate with the course query engine." 
                }
              : msg
          )
        );
      }
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getPromptSuggestions = () => [
    { title: "Break Down a Concept", prompt: "Explain a difficult concept from my syllabus step-by-step with clear definitions and practical examples." },
    { title: "Exam Answer Structure", prompt: "How should I structure my answers in semester examinations to achieve full marks based on marking schemes?" },
    { title: "Practice Exam Question", prompt: "Give me an examination-style practice question and guide me through the key marking criteria." },
    { title: "Formula & Derivation Steps", prompt: "Walk me through how to approach mathematical derivations and calculations step-by-step." },
    { title: "Compare & Contrast Topics", prompt: "Compare and contrast two related technical concepts, detailing their core trade-offs and applications." },
    { title: "Marking Scheme Orientation", prompt: "Hello! How does your marking rubric grading work and how do you learn from lecturers?" }
  ];

  const firstName = currentUser?.name?.split(' ')[0] || 'Scholar';

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] max-w-4xl mx-auto w-full px-4 relative bg-transparent">
      {/* Top Bar with Agent Memory Status (No Dropdown - Auto-Updated as lecturers upload) */}
      <div className="py-2.5 border-b border-purple-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center space-x-2.5 flex-1 min-w-[280px]">
          <div className="flex items-center space-x-2 text-purple-900 font-semibold shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <GraduationCap className="w-4 h-4 text-purple-600" />
            <span className="font-bold text-xs text-slate-900">Study Agent:</span>
          </div>

          <div className="inline-flex items-center space-x-2 bg-purple-50/80 border border-purple-200/80 rounded-xl px-3 py-1 text-xs text-purple-950 font-medium">
            <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Institutional Knowledge Base Connected</span>
            <span className="text-purple-300">|</span>
            <span className="text-[11px] text-purple-700 hidden sm:inline">
              Auto-learns from lecturer input
            </span>
          </div>
        </div>

        {/* Gemini API & Guardrail Status Badge */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1.5 text-[11px] text-purple-800 bg-purple-50 border border-purple-200/80 px-2.5 py-1 rounded-full font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Verified Past Papers & Rubrics</span>
            <span className="sm:hidden">Grounded</span>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="p-1 text-purple-400 hover:text-purple-700 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
              title="Reset conversation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation Thread / Empty State */}
      <div className="flex-1 overflow-y-auto py-5 space-y-5 pr-1">
        {messages.length === 0 ? (
          /* EMPTY STATE / GREETING HERO */
          <div className="h-full flex flex-col justify-center items-center text-center space-y-6 max-w-xl mx-auto my-auto py-8 animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
              <Bot className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Welcome, <span className="text-purple-700">{firstName}</span>!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
                Ask any question across your university courses, past examination papers, or marking schemes. 
                I deliver verified, grounded explanations and automatically learn as lecturers upload syllabus materials.
              </p>
            </div>

            {/* Anti-Hallucination & Active Learning Assurance Card */}
            <div className="w-full bg-white border border-purple-200/80 rounded-2xl p-4 text-left shadow-2xs flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold shrink-0">
                <ShieldCheck className="w-5 h-5 text-purple-700" />
              </div>
              <div className="text-xs space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs text-purple-950">Grounded & Zero-Hallucination</span>
                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                    ● Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  I only answer from verified course materials. If I don't have information about a topic, I will let you know instead of guessing. As lecturers upload new materials, I automatically learn from them.
                </p>
              </div>
            </div>

            {/* Student Study Prompt Suggestions (White and Light Purple Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left pt-1">
              {getPromptSuggestions().map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(item.prompt)}
                  className="p-3.5 rounded-2xl bg-white hover:bg-purple-50/50 border border-purple-100 hover:border-purple-300 transition-all text-xs space-y-1 shadow-2xs group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-950 group-hover:text-purple-700 transition-colors">
                      {item.title}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {item.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* MESSAGE STREAM */
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'bot' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`rounded-2xl p-4 text-xs leading-relaxed space-y-2.5 max-w-2xl ${
                  msg.sender === 'user'
                    ? 'bg-purple-100 border border-purple-200/90 text-purple-950 ml-12 shadow-2xs'
                    : 'bg-white border border-purple-100/90 text-slate-800 mr-8 w-full shadow-sm'
                }`}
              >
                {/* Header (Sender / timestamp / copy) */}
                <div className="flex items-center justify-between text-[11px] pb-1 border-b border-purple-100/60 gap-4">
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold ${msg.sender === 'user' ? 'text-purple-800' : 'text-purple-900'}`}>
                      {msg.sender === 'user' ? 'You' : 'Study Better AI'}
                    </span>
                    {msg.sender === 'bot' && msg.course && (
                      <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded font-mono border border-purple-200/60">
                        {msg.course.course_code || ''}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={msg.sender === 'user' ? 'text-purple-500 text-[10px]' : 'text-slate-400 text-[10px]'}>
                      {msg.timestamp}
                    </span>
                    {msg.sender === 'bot' && (
                      <>
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="text-purple-400 hover:text-purple-700 p-0.5 rounded transition-colors cursor-pointer"
                          title="Copy answer"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Message Content: Clean White & Light Purple typography */}
                {msg.sender === 'user' ? (
                  <div className="text-purple-950 font-medium text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </div>
                ) : (
                  <div className="prose prose-xs max-w-none text-slate-800 prose-headings:font-bold prose-headings:text-purple-950 prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-purple-950 prose-blockquote:border-l-purple-500 prose-blockquote:bg-purple-50/50 prose-blockquote:p-2 prose-blockquote:rounded-r">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        code: CodeBlock
                      }}
                    >
                      {msg.text || (msg.isStreaming ? '' : 'No content generated.')}
                    </ReactMarkdown>

                    {/* Streaming pulse cursor */}
                    {msg.isStreaming && (
                      <span className="inline-block w-1.5 h-4 ml-1 bg-purple-500 animate-pulse align-middle rounded-xs" />
                    )}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-purple-200 text-purple-800 flex items-center justify-center shrink-0 border border-purple-300 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Global Loading Indicator before first token */}
        {loading && messages.length > 0 && messages[messages.length - 1].sender === 'bot' && !messages[messages.length - 1].text && (
          <div className="flex items-center space-x-2 text-xs text-purple-700 px-4 py-2 bg-purple-50 border border-purple-200 rounded-2xl w-fit shadow-2xs animate-in fade-in">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping mr-1" />
            <span>Retrieving verified past papers & querying Gemini 1.5 Pro...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Input Bar (White & Light Purple) */}
      <div className="pt-2 pb-4 bg-gradient-to-t from-white via-white/90 to-transparent sticky bottom-0 z-20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative bg-white rounded-3xl border border-purple-200/90 shadow-md shadow-purple-500/5 focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-purple-400 transition-all flex items-end p-2"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask any exam question, syllabus topic, or past paper problem..."
            className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-purple-950 placeholder-purple-300 focus:outline-none resize-none max-h-32 leading-relaxed"
            disabled={loading}
          />

          {loading ? (
            <button
              type="button"
              onClick={handleStopStream}
              className="bg-rose-500 hover:bg-rose-600 text-white p-2.5 rounded-2xl transition-all shrink-0 ml-1 shadow-2xs flex items-center justify-center cursor-pointer"
              title="Stop streaming response"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-30 text-white p-2.5 rounded-2xl transition-all shrink-0 ml-1 shadow-2xs cursor-pointer shadow-purple-500/20"
              title="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>

        <div className="flex items-center justify-between text-[11px] text-purple-600 px-3 pt-1.5">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-500 inline mr-1" />
            <span>Responses are grounded strictly in your department's verified course materials.</span>
          </span>
          <span className="font-mono text-[10px] text-purple-400 hidden sm:inline">Shift+Enter for newline</span>
        </div>
      </div>

      {/* Lecturer & Student Quality Feedback / Calibration Modal */}
      {feedbackModalOpen && activeFeedbackMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-purple-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-purple-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-purple-950">
                    Quality Control & Lecturer Calibration
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Course: {activeFeedbackMsg.course?.course_code || 'CSC 321'} · Department of Computer Science
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFeedbackModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {feedbackSuccessToast ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-900">{feedbackSuccessToast}</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Rating (1-5 stars) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Examiner / Academic Quality Rating:
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className="p-1 transition-transform hover:scale-110 cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= feedbackRating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-[11px] font-semibold text-slate-500 ml-2">
                      {feedbackRating === 5 ? 'Exceptional Grounding' : feedbackRating === 4 ? 'Good Grounding' : feedbackRating === 3 ? 'Acceptable' : feedbackRating === 2 ? 'Deficient' : 'Major Errors'}
                    </span>
                  </div>
                </div>

                {/* Hallucination Checkbox */}
                <div className="flex items-center space-x-2.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <input
                    type="checkbox"
                    id="hallucination_check"
                    checked={isHallucination}
                    onChange={(e) => setIsHallucination(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-slate-300"
                  />
                  <label htmlFor="hallucination_check" className="cursor-pointer text-[11px] font-medium text-amber-900">
                    <span className="font-bold text-amber-950">Flag Hallucination / Factual Inaccuracy:</span> The AI generated claims not supported by the institutional marking scheme.
                  </label>
                </div>

                {/* Feedback Notes */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Feedback Notes & Marking Critique:
                  </label>
                  <textarea
                    rows={3}
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                    placeholder="Describe specific missed criteria, terminology errors, or marking discrepancies..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                  />
                </div>

                {/* Lecturer Calibration: Gold-Standard Corrected Solution */}
                <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-200/80 space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-purple-900 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Lecturer Calibration (Optional Exemplar):</span>
                  </div>
                  <p className="text-[10px] text-purple-700 leading-relaxed">
                    Provide the verified departmental model answer. The system will automatically index your solution into the institutional vector store so future student queries retrieve your verified answer!
                  </p>
                  <textarea
                    rows={4}
                    value={correctedAnswer}
                    onChange={(e) => setCorrectedAnswer(e.target.value)}
                    placeholder="Enter the official model answer and rubric steps here..."
                    className="w-full bg-white border border-purple-200 rounded-xl p-2.5 text-xs text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none font-mono text-[11px]"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submittingFeedback}
                    onClick={handleSubmitFeedback}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {submittingFeedback ? 'Recording...' : correctedAnswer.trim() ? 'Calibrate into Knowledge Base' : 'Submit Feedback'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

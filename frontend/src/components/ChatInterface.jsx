import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ChevronDown, ChevronRight, Bookmark, Sparkles, Loader2, Database, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function ChatInterface({ selectedCourse, setSelectedCourse }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! I am CourseGPT, your course-aware AI study assistant for the Department of Computer Science at the University of Ibadan.\n\nI am trained and grounded on real past exam questions, official marking schemes, and syllabus topics across 5 academic sessions. Ask me conceptual questions, exam patterns, or request mock exams!",
      trace: [],
      citations: ["[University of Ibadan CSC Historical Knowledge Base]"]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [openTraces, setOpenTraces] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const toggleTrace = (msgId) => {
    setOpenTraces((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleSend = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      course: selectedCourse
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const response = await api.sendAgentChat(textToSend, selectedCourse);
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response.final_answer,
        trace: response.trace || [],
        citations: response.citations || [],
        toolData: response.tool_data
      };
      setMessages((prev) => [...prev, botMsg]);
      // Automatically expand trace for transparency
      if (response.trace && response.trace.length > 0) {
        setOpenTraces((prev) => ({ ...prev, [botMsg.id]: true }));
      }
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "Apologies, an error occurred while connecting to the CourseGPT backend service. Please verify the backend is active.",
        trace: [],
        citations: []
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    { title: "CSC 321 Memory Allocation", prompt: "Explain fixed partitions and internal fragmentation in CSC 321" },
    { title: "CSC 222 Hamming Code", prompt: "How does Hamming code detect and correct errors in CSC 222?" },
    { title: "CSC 583 Security Threats", prompt: "What are the types of threats to computer security in CSC 583?" },
    { title: "CSC 231 Mock Exam", prompt: "Generate a mock exam for CSC 231" },
    { title: "CSC 321 Exam Trends", prompt: "Show topic frequency heatmap and likely to appear questions for CSC 321" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-5xl mx-auto p-4">
      {/* Sample Quick Questions Pill Strip */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-3 pt-1 text-xs">
        <span className="text-slate-500 font-medium whitespace-nowrap flex items-center">
          <Sparkles className="w-3.5 h-3.5 mr-1 text-sky-500" /> Suggested:
        </span>
        {samplePrompts.map((sp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(sp.prompt)}
            className="bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-300 rounded-full px-3 py-1 whitespace-nowrap shadow-sm transition-all"
          >
            {sp.title}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start space-x-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'bot' && (
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-[85%] ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-sky-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none'
                }`}
              >
                {/* ReAct Trace Accordion for Bot Messages */}
                {m.sender === 'bot' && m.trace && m.trace.length > 0 && (
                  <div className="mb-3 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <button
                      onClick={() => toggleTrace(m.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      <span className="flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>ReAct Reasoning Trace ({m.trace.length} Steps)</span>
                      </span>
                      {openTraces[m.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    {openTraces[m.id] && (
                      <div className="p-3 space-y-2 text-xs divide-y divide-slate-200">
                        {m.trace.map((step, sIdx) => (
                          <div key={sIdx} className="pt-2 first:pt-0 space-y-1">
                            <div className="flex items-start space-x-2">
                              <span className="bg-sky-100 text-sky-800 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                                Thought
                              </span>
                              <p className="text-slate-700">{step.thought}</p>
                            </div>
                            <div className="flex items-start space-x-2">
                              <span className="bg-amber-100 text-amber-800 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                                Action
                              </span>
                              <span className="font-mono text-slate-800 font-medium">`{step.action}`</span>
                              {step.action_input && (
                                <span className="text-slate-500 font-mono text-[10px]">
                                  {JSON.stringify(step.action_input)}
                                </span>
                              )}
                            </div>
                            {step.observation && (
                              <div className="flex items-start space-x-2">
                                <span className="bg-purple-100 text-purple-800 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                                  Observation
                                </span>
                                <p className="text-slate-600">{step.observation}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Final Answer Text */}
                <div className="whitespace-pre-wrap font-sans text-slate-800 space-y-2">
                  {m.text}
                </div>

                {/* Academic Source Citations */}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[11px] font-medium text-slate-500 flex items-center">
                      <Bookmark className="w-3 h-3 mr-1 text-sky-500" /> Grounded In:
                    </span>
                    {m.citations.map((c, cIdx) => (
                      <span
                        key={cIdx}
                        className="bg-sky-50 text-sky-800 border border-sky-200 text-[11px] px-2 py-0.5 rounded font-mono font-medium"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {m.sender === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white shrink-0 shadow-md">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-3 text-slate-500 text-xs py-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600/20 text-sky-600 flex items-center justify-center animate-spin">
              <Loader2 className="w-4 h-4" />
            </div>
            <span className="font-medium">
              CourseGPT ReAct agent is querying ChromaDB vector space and departmental rubrics...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <div className="pt-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2 bg-white rounded-2xl border border-slate-300 shadow-sm p-1.5 focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-sky-500"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedCourse
                ? `Ask CourseGPT about ${selectedCourse} past questions, concepts, or marking schemes...`
                : "Ask CourseGPT about any UI CSC course (e.g. CSC 321, CSC 231, CSC 583)..."
            }
            className="flex-1 px-4 py-2 text-sm focus:outline-none text-slate-800 bg-transparent placeholder-slate-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center space-x-1 transition-all shadow-md shadow-sky-600/20"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <p className="text-[11px] text-center text-slate-400 mt-2">
          Responses are strictly grounded in University of Ibadan Department of Computer Science past examinations & marking guides.
        </p>
      </div>
    </div>
  );
}

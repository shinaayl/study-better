import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ChatInterface from './components/ChatInterface';
import EvaluationPortal from './components/EvaluationPortal';
import TopicHeatmap from './components/TopicHeatmap';
import MockExamView from './components/MockExamView';
import PerformanceDashboard from './components/PerformanceDashboard';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');

  useEffect(() => {
    api.getCourses()
      .then((res) => {
        setCourses(res.courses || []);
        if (res.courses && res.courses.length > 0) {
          // Default to CSC 321 or first course
          const c321 = res.courses.find((c) => c.course_code === 'CSC 321');
          if (c321) setSelectedCourse('CSC 321');
          else setSelectedCourse(res.courses[0].course_code);
        }
      })
      .catch((err) => console.error('Failed to load courses:', err));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        courses={courses}
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
      />

      <main className="flex-1 py-4">
        {activeTab === 'chat' && (
          <ChatInterface
            selectedCourse={selectedCourse}
            setSelectedCourse={setSelectedCourse}
          />
        )}

        {activeTab === 'evaluation' && (
          <EvaluationPortal
            courses={courses}
            selectedCourse={selectedCourse}
            setSelectedCourse={setSelectedCourse}
          />
        )}

        {activeTab === 'heatmap' && (
          <TopicHeatmap
            selectedCourse={selectedCourse}
            setSelectedCourse={setSelectedCourse}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'mock' && (
          <MockExamView
            courses={courses}
            selectedCourse={selectedCourse}
            setSelectedCourse={setSelectedCourse}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'analytics' && (
          <PerformanceDashboard
            selectedCourse={selectedCourse}
            setActiveTab={setActiveTab}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            CourseGPT · Department of Computer Science · University of Ibadan
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            B.Sc. Final Year Project · 2024/2025 Academic Session
          </span>
        </div>
      </footer>
    </div>
  );
}

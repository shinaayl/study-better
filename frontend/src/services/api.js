const API_BASE = '/api';

export const api = {
  async getCourses() {
    const res = await fetch(`${API_BASE}/courses`);
    if (!res.ok) throw new Error('Failed to fetch courses');
    return res.json();
  },

  async getCourseQuestions(courseCode) {
    const res = await fetch(`${API_BASE}/courses/${encodeURIComponent(courseCode)}/questions`);
    if (!res.ok) throw new Error('Failed to fetch course questions');
    return res.json();
  },

  async getQuestionDetails(questionId) {
    const res = await fetch(`${API_BASE}/courses/question/${questionId}`);
    if (!res.ok) throw new Error('Failed to fetch question details');
    return res.json();
  },

  async sendAgentChat(query, courseCode, studentId = 'ui-cs-demo-matric-230880') {
    const res = await fetch(`${API_BASE}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, course_code: courseCode, student_id: studentId })
    });
    if (!res.ok) throw new Error('Failed to send query to agent');
    return res.json();
  },

  async submitEvaluation(data) {
    const res = await fetch(`${API_BASE}/evaluation/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to submit evaluation');
    return res.json();
  },

  async getEvaluationHistory(studentId = 'ui-cs-demo-matric-230880') {
    const res = await fetch(`${API_BASE}/evaluation/history/${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch evaluation history');
    return res.json();
  },

  async getHeatmap(courseCode = '') {
    const url = courseCode ? `${API_BASE}/analytics/heatmap?course_code=${encodeURIComponent(courseCode)}` : `${API_BASE}/analytics/heatmap`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch heatmap');
    return res.json();
  },

  async getWeakAreas(studentId = 'ui-cs-demo-matric-230880', courseCode = '') {
    const url = courseCode 
      ? `${API_BASE}/analytics/weak-areas/${studentId}?course_code=${encodeURIComponent(courseCode)}`
      : `${API_BASE}/analytics/weak-areas/${studentId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch weak areas');
    return res.json();
  },

  async generateMockExam(courseCode, numQuestions = 3) {
    const res = await fetch(`${API_BASE}/agent/mock-exam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_code: courseCode, num_questions: numQuestions })
    });
    if (!res.ok) throw new Error('Failed to generate mock exam');
    return res.json();
  },

  async getSystemInfo() {
    const res = await fetch(`${API_BASE}/info`);
    if (!res.ok) throw new Error('Failed to fetch system info');
    return res.json();
  }
};

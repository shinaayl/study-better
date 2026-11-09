const defaultBackend = import.meta.env.PROD ? 'https://study-better.onrender.com' : '';
const rawBaseUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || defaultBackend).trim().replace(/\/+$/, '');
const API_BASE = rawBaseUrl
  ? (rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`)
  : '/api';

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

  async getStats() {
    const res = await fetch(`${API_BASE}/courses/stats`);
    if (!res.ok) throw new Error('Failed to fetch knowledge base stats');
    return res.json();
  },

  async getDocuments() {
    const res = await fetch(`${API_BASE}/courses/documents`);
    if (!res.ok) throw new Error('Failed to fetch ingested documents');
    return res.json();
  },

  async getDocumentChunks(documentId) {
    const res = await fetch(`${API_BASE}/courses/documents/${documentId}/chunks`, {
      headers: { ...this.getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch document chunks');
    return res.json();
  },

  async deleteDocument(documentId) {
    const res = await fetch(`${API_BASE}/courses/documents/${documentId}`, {
      method: 'DELETE',
      headers: { ...this.getAuthHeaders() }
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to delete document');
    }
    return res.json();
  },

  async createCourse(data) {
    const res = await fetch(`${API_BASE}/courses/create`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create course');
    return res.json();
  },

  async deleteCourse(courseCode) {
    const res = await fetch(`${API_BASE}/courses/${encodeURIComponent(courseCode)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete course');
    return res.json();
  },

  async sendAgentChat(query, courseCode, studentId = 'ui-cs-demo-matric-230880') {
    const res = await fetch(`${API_BASE}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, course_code: courseCode, student_id: studentId }),
    });
    if (!res.ok) throw new Error('Failed to send query to agent');
    return res.json();
  },

  async queryChat({ student_message, course_id, conversation_history = [], stream = false }) {
    const res = await fetch(`${API_BASE}/chat/query`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({
        student_message,
        course_id: course_id || null,
        conversation_history,
        stream
      }),
    });
    if (!res.ok) throw new Error('Failed to query RAG engine');
    return res.json();
  },

  async streamChatQuery({
    student_message,
    course_id,
    conversation_history = [],
    onSources,
    onDelta,
    onGuardrail,
    onDone,
    onError,
    signal
  }) {
    try {
      const res = await fetch(`${API_BASE}/chat/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify({
          student_message,
          course_id: course_id || null,
          conversation_history,
          stream: true
        }),
        signal
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep partial line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const jsonStr = trimmed.slice(5).trim();
          if (jsonStr === '[DONE]') {
            if (onDone) onDone();
            continue;
          }

          try {
            const data = JSON.parse(jsonStr);
            if (data.event === 'sources') {
              if (onSources) onSources(data.sources, data.course);
            } else if (data.event === 'delta') {
              if (onDelta) onDelta(data.delta);
            } else if (data.event === 'guardrail') {
              if (onGuardrail) onGuardrail(data.guardrail);
            } else if (data.event === 'done') {
              if (onDone) onDone(data);
            } else if (data.event === 'error') {
              if (onError) onError(new Error(data.message));
            }
          } catch (parseErr) {
            console.error('Failed to parse SSE payload:', jsonStr, parseErr);
          }
        }
      }
      if (onDone) onDone();
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('SSE stream interrupted, attempting non-streaming fallback:', err);
      try {
        // Fallback to sync JSON endpoint
        const fallbackRes = await this.queryChat({
          student_message,
          course_id,
          conversation_history,
          stream: false
        });
        if (fallbackRes && fallbackRes.answer) {
          if (onSources && fallbackRes.sources) onSources(fallbackRes.sources, fallbackRes.course);
          if (onDelta) onDelta(fallbackRes.answer);
          if (onDone) onDone(fallbackRes);
          return;
        }
      } catch (fallbackErr) {
        console.error('Non-streaming fallback failed:', fallbackErr);
      }
      if (onError) onError(err);
      else throw err;
    }
  },

  async submitEvaluation(data) {
    const res = await fetch(`${API_BASE}/evaluation/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
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
      body: JSON.stringify({ course_code: courseCode, num_questions: numQuestions }),
    });
    if (!res.ok) throw new Error('Failed to generate mock exam');
    return res.json();
  },

  async getSettings() {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(data) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async getSystemInfo() {
    const res = await fetch(`${API_BASE}/info`);
    if (!res.ok) throw new Error('Failed to fetch system info');
    return res.json();
  },

  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/auth/current-user`);
    if (!res.ok) throw new Error('Failed to fetch current user');
    return res.json();
  },

  async getDemoUsers() {
    const res = await fetch(`${API_BASE}/auth/demo-users`);
    if (!res.ok) throw new Error('Failed to fetch demo users');
    return res.json();
  },

  getAuthHeaders() {
    const token = localStorage.getItem('ai_study_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },

  async uploadDocument(formData) {
    const res = await fetch(`${API_BASE}/courses/upload`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to upload and ingest document');
    }
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        ...this.getAuthHeaders(),
      },
    });
    if (!res.ok) return null;
    return res.json();
  },

  async googleLogin(data) {
    const res = await fetch(`${API_BASE}/auth/google-login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to authenticate');
    }
    const result = await res.json();
    if (result.access_token) {
      localStorage.setItem('ai_study_token', result.access_token);
    }
    return result;
  },

  async completeOnboarding(data) {
    const res = await fetch(`${API_BASE}/auth/complete-onboarding`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to complete onboarding');
    }
    const result = await res.json();
    if (result.access_token) {
      localStorage.setItem('ai_study_token', result.access_token);
    }
    return result;
  },

  async logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
        },
      });
    } catch (e) {}
    localStorage.removeItem('ai_study_token');
    return { status: 'success' };
  },

  async submitFeedback(data) {
    const res = await fetch(`${API_BASE}/feedback/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to submit feedback');
    }
    return res.json();
  },

  async getFeedbackList(params = {}) {
    const query = new URLSearchParams();
    if (params.course_code) query.append('course_code', params.course_code);
    if (params.status) query.append('status', params.status);
    if (params.is_hallucination !== undefined && params.is_hallucination !== null) {
      query.append('is_hallucination', params.is_hallucination);
    }
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);

    const res = await fetch(`${API_BASE}/feedback/list?${query.toString()}`, {
      headers: { ...this.getAuthHeaders() },
    });
    if (!res.ok) throw new Error('Failed to fetch feedback list');
    return res.json();
  },

  async updateFeedbackStatus(feedbackId, status) {
    const res = await fetch(`${API_BASE}/feedback/${feedbackId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update feedback status');
    return res.json();
  },

  async calibrateFeedback(feedbackId, data) {
    const res = await fetch(`${API_BASE}/feedback/${feedbackId}/calibrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to calibrate feedback');
    }
    return res.json();
  },

  async getGuardrailLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.course_code) query.append('course_code', params.course_code);
    if (params.hallucination_risk) query.append('hallucination_risk', params.hallucination_risk);
    if (params.guardrail_action) query.append('guardrail_action', params.guardrail_action);
    if (params.limit) query.append('limit', params.limit);

    const res = await fetch(`${API_BASE}/guardrails/logs?${query.toString()}`, {
      headers: { ...this.getAuthHeaders() },
    });
    if (!res.ok) throw new Error('Failed to fetch guardrail logs');
    return res.json();
  },

  async getGuardrailMetrics() {
    const res = await fetch(`${API_BASE}/guardrails/metrics`, {
      headers: { ...this.getAuthHeaders() },
    });
    if (!res.ok) throw new Error('Failed to fetch guardrail metrics');
    return res.json();
  },
};

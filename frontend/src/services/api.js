/**
 * API Service Layer
 * Handles all HTTP requests to backend and ML API
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const ML_API_URL = process.env.REACT_APP_ML_API_URL || 'http://localhost:8001';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function to handle responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || 'Request failed');
  }
  return response.json();
};

// ============= Authentication API =============

export const authAPI = {
  register: async (userData) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  login: async (credentials) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return handleResponse(response);
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  logout: async () => {
    localStorage.removeItem('access_token');
  }
};

// ============= Courses API =============

export const coursesAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/api/courses?${queryString}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (courseId) => {
    const response = await fetch(`${API_URL}/api/courses/${courseId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (courseData) => {
    const response = await fetch(`${API_URL}/api/courses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(courseData)
    });
    return handleResponse(response);
  },

  update: async (courseId, courseData) => {
    const response = await fetch(`${API_URL}/api/courses/${courseId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(courseData)
    });
    return handleResponse(response);
  },

  delete: async (courseId) => {
    const response = await fetch(`${API_URL}/api/courses/${courseId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getModules: async (courseId) => {
    const response = await fetch(`${API_URL}/api/courses/${courseId}/modules`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// ============= Modules API =============

export const modulesAPI = {
  getById: async (moduleId) => {
    const response = await fetch(`${API_URL}/api/modules/${moduleId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getLessons: async (moduleId) => {
    const response = await fetch(`${API_URL}/api/modules/${moduleId}/lessons`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getQuizzes: async (moduleId) => {
    const response = await fetch(`${API_URL}/api/modules/${moduleId}/quizzes`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// ============= Lessons API =============

export const lessonsAPI = {
  getById: async (lessonId) => {
    const response = await fetch(`${API_URL}/api/lessons/${lessonId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// ============= Quizzes API =============

export const quizzesAPI = {
  getById: async (quizId) => {
    const response = await fetch(`${API_URL}/api/quizzes/${quizId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  submit: async (attemptData) => {
    const response = await fetch(`${API_URL}/api/quizzes/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(attemptData)
    });
    return handleResponse(response);
  },

  getResults: async (quizId) => {
    const response = await fetch(`${API_URL}/api/quizzes/${quizId}/results`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// ============= Progress API =============

export const progressAPI = {
  getCourseProgress: async (courseId) => {
    const response = await fetch(`${API_URL}/api/progress/course/${courseId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getUserProgress: async (userId) => {
    const response = await fetch(`${API_URL}/api/progress/user/${userId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  updateProgress: async (progressData) => {
    const response = await fetch(`${API_URL}/api/progress`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(progressData)
    });
    return handleResponse(response);
  },

  markLessonComplete: async (lessonId) => {
    const response = await fetch(`${API_URL}/api/progress`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        lesson_id: lessonId,
        completion_status: 'completed'
      })
    });
    return handleResponse(response);
  }
};

// ============= Analytics API =============

export const analyticsAPI = {
  getDashboard: async () => {
    const response = await fetch(`${API_URL}/api/analytics/dashboard`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getInstructor: async () => {
    const response = await fetch(`${API_URL}/api/analytics/instructor`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getUser: async () => {
    const response = await fetch(`${API_URL}/api/analytics/user`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// ============= ML API =============

export const mlAPI = {
  getRecommendations: async (userId, topN = 10) => {
    const response = await fetch(`${ML_API_URL}/api/ml/recommendations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ user_id: userId, top_n: topN })
    });
    return handleResponse(response);
  },

  getColdStartRecommendations: async (categories = null, difficulty = 'beginner') => {
    const response = await fetch(`${ML_API_URL}/api/ml/recommendations/cold-start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ categories, difficulty })
    });
    return handleResponse(response);
  },

  predictDropout: async (userData) => {
    const response = await fetch(`${ML_API_URL}/api/ml/predict-dropout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ user_data: userData })
    });
    return handleResponse(response);
  },

  getEngagementScore: async (userData) => {
    const response = await fetch(`${ML_API_URL}/api/ml/engagement-score`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ user_data: userData })
    });
    return handleResponse(response);
  }
};

export default {
  authAPI,
  coursesAPI,
  modulesAPI,
  lessonsAPI,
  quizzesAPI,
  progressAPI,
  analyticsAPI,
  mlAPI
};

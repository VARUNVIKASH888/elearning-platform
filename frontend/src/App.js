/**
 * Main App Component
 * E-Learning Platform Frontend
 */
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components (to be created)
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import StudentDashboard from './components/Student/Dashboard';
import InstructorDashboard from './components/Instructor/Dashboard';
import AdminDashboard from './components/Admin/Dashboard';
import CourseList from './components/Courses/CourseList';
import CourseDetail from './components/Courses/CourseDetail';
import LessonViewer from './components/Lessons/LessonViewer';
import QuizTaker from './components/Quiz/QuizTaker';
import ProgressTracker from './components/Progress/ProgressTracker';
import Recommendations from './components/Recommendations/Recommendations';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import PrivateRoute from './components/Common/PrivateRoute';
import Profile from './components/Profile/Profile';


// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#e33371',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token
    const token = localStorage.getItem('access_token');
    if (token) {
      // Fetch current user
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('access_token');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem('access_token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/register" 
            element={
              user ? <Navigate to="/dashboard" /> : <Register onRegister={handleLogin} />
            } 
          />

          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute user={user}>
                {user?.role === 'student' && <StudentDashboard user={user} onLogout={handleLogout} />}
                {user?.role === 'instructor' && <InstructorDashboard user={user} onLogout={handleLogout} />}
                {user?.role === 'admin' && <AdminDashboard user={user} onLogout={handleLogout} />}
              </PrivateRoute>
            } 
          />

          <Route 
            path="/courses" 
            element={
              <PrivateRoute user={user}>
                <CourseList user={user} onLogout={handleLogout} />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/courses/:courseId" 
            element={
              <PrivateRoute user={user}>
                <CourseDetail user={user} onLogout={handleLogout} />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/lessons/:lessonId" 
            element={
              <PrivateRoute user={user}>
                <LessonViewer user={user} onLogout={handleLogout} />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/quiz/:moduleId/:quizId" 
            element={
              <PrivateRoute user={user}>
                <QuizTaker user={user} onLogout={handleLogout} />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/progress" 
            element={
              <PrivateRoute user={user}>
                <ProgressTracker user={user} onLogout={handleLogout} />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/recommendations" 
            element={
              <PrivateRoute user={user}>
                <Recommendations user={user} onLogout={handleLogout} />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/analytics" 
            element={
              <PrivateRoute user={user}>
                <AnalyticsDashboard user={user} onLogout={handleLogout} />
              </PrivateRoute>
            } 
          />

          {/* Default Route */}
          <Route 
            path="/" 
            element={
              user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/profile" 
            element={
              <PrivateRoute user={user}>
                <Profile user={user} onLogout={handleLogout} />
              </PrivateRoute>
            } 
          />

          {/* 404 */}
          <Route 
            path="*" 
            element={
              <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h1>404 - Page Not Found</h1>
              </div>
            } 
          />
        </Routes>

      </Router>
      
      {/* Toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </ThemeProvider>
  );
}

export default App;
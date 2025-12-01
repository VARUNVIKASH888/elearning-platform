import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography,
  CircularProgress, Divider
} from '@mui/material';
import Navbar from '../Common/Navbar';

const AnalyticsDashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [instructorStats, setInstructorStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === 'admin') {
          // Admin gets platform-wide analytics
          const res = await fetch('http://localhost:8000/api/analytics/dashboard', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          setStats(data);
        } else if (user?.role === 'instructor') {
          // Instructor gets their course analytics
          const res = await fetch('http://localhost:8000/api/analytics/instructor', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          setInstructorStats(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Analytics error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, token]);

  // Admin stat cards
  const adminCards = stats ? [
    { label: 'Total Users', value: stats.total_users, icon: '👥', color: 'primary.main' },
    { label: 'Total Courses', value: stats.total_courses, icon: '📚', color: 'secondary.main' },
    { label: 'Total Enrollments', value: stats.total_enrollments, icon: '🎓', color: 'success.main' },
    { label: 'Active Today', value: stats.active_users_today, icon: '🟢', color: 'warning.main' },
    { label: 'Quiz Attempts', value: stats.total_quiz_attempts, icon: '📝', color: 'info.main' },
    {
      label: 'Avg Quiz Score',
      value: stats.average_quiz_score != null
        ? `${Number(stats.average_quiz_score).toFixed(1)}%` : '–',
      icon: '🏆',
      color: 'error.main'
    },
  ] : [];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar user={user} onLogout={onLogout} />
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight={700} mb={1}>Analytics Dashboard</Typography>
        <Typography color="text.secondary" mb={4}>
          {user?.role === 'admin' ? 'Platform-wide performance insights' : 'Your course analytics'}
        </Typography>

        {loading ? <CircularProgress /> : (
          <>
            {/* Admin View */}
            {user?.role === 'admin' && (
              <Grid container spacing={3}>
                {adminCards.map(item => (
                  <Grid item xs={12} sm={6} md={4} key={item.label}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" mb={1}>
                          {item.icon} {item.label}
                        </Typography>
                        <Typography variant="h4" fontWeight={700} color={item.color}>
                          {item.value ?? '–'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* Instructor View */}
            {user?.role === 'instructor' && (
              <>
                {instructorStats.length === 0 ? (
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        No analytics data yet — students need to enroll in your courses first
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  <Grid container spacing={3}>
                    {instructorStats.map((stat, i) => (
                      <Grid item xs={12} md={6} key={i}>
                        <Card>
                          <CardContent>
                            <Typography fontWeight={700} variant="h6" mb={2}>
                              {stat.course_title || `Course ${i + 1}`}
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Enrollments</Typography>
                                <Typography variant="h5" fontWeight={700} color="primary.main">
                                  {stat.total_enrollments ?? '–'}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Avg Completion</Typography>
                                <Typography variant="h5" fontWeight={700} color="success.main">
                                  {stat.average_completion != null
                                    ? `${Number(stat.average_completion).toFixed(1)}%` : '–'}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Avg Quiz Score</Typography>
                                <Typography variant="h5" fontWeight={700} color="secondary.main">
                                  {stat.average_quiz_score != null
                                    ? `${Number(stat.average_quiz_score).toFixed(1)}%` : '–'}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">At Risk Students</Typography>
                                <Typography variant="h5" fontWeight={700} color="error.main">
                                  {stat.at_risk_students ?? '–'}
                                </Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default AnalyticsDashboard;
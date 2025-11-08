import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button,
  LinearProgress, CircularProgress, Avatar, Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Common/Navbar';
import { coursesAPI, progressAPI } from '../../services/api';

const Dashboard = ({ user, onLogout }) => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completed: 0,
    inProgress: 0,
    avgProgress: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesRes = await coursesAPI.getAll();
        const allCourses = coursesRes;

        const enrolled = [];
        for (const course of allCourses) {
          try {
            const progress = await progressAPI.getCourseProgress(course.id);
            if (progress && progress.length > 0) {
              const completed = progress.filter(p => p.completion_status === 'completed').length;
              const percentage = (completed / progress.length) * 100;
              enrolled.push({ ...course, progress: percentage });
            }
          } catch (err) {
            // Not enrolled
          }
        }
        
        setEnrolledCourses(enrolled);
        
        // Calculate stats
        const totalCourses = enrolled.length;
        const completed = enrolled.filter(c => c.progress === 100).length;
        const inProgress = enrolled.filter(c => c.progress > 0 && c.progress < 100).length;
        const avgProgress = totalCourses > 0 
          ? enrolled.reduce((sum, c) => sum + c.progress, 0) / totalCourses 
          : 0;
        
        setStats({ totalCourses, completed, inProgress, avgProgress });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Navbar user={user} onLogout={onLogout} />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar user={user} onLogout={onLogout} />
      <Box sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} mb={1}>
            Welcome back, {user.name}! 👋
          </Typography>
          <Typography color="text.secondary">
            Continue your learning journey
          </Typography>
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Enrolled Courses
                </Typography>
                <Typography variant="h3" fontWeight={700} color="primary.main">
                  {stats.totalCourses}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Completed
                </Typography>
                <Typography variant="h3" fontWeight={700} color="success.main">
                  {stats.completed}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  In Progress
                </Typography>
                <Typography variant="h3" fontWeight={700} color="warning.main">
                  {stats.inProgress}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Avg Progress
                </Typography>
                <Typography variant="h3" fontWeight={700} color="info.main">
                  {stats.avgProgress.toFixed(0)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* My Courses */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" fontWeight={600}>
              My Courses
            </Typography>
            <Button variant="outlined" onClick={() => navigate('/courses')}>
              Browse All Courses
            </Button>
          </Box>

          {enrolledCourses.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" color="text.secondary" mb={2}>
                  You haven't enrolled in any courses yet
                </Typography>
                <Typography color="text.secondary" mb={3}>
                  Start your learning journey today!
                </Typography>
                <Button variant="contained" size="large" onClick={() => navigate('/courses')}>
                  Explore Courses
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {enrolledCourses.map(course => (
                <Grid item xs={12} sm={6} md={4} key={course.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Chip 
                          label={course.difficulty_level || 'Beginner'} 
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        {course.progress === 100 && (
                          <Chip label="✓ Completed" size="small" color="success" />
                        )}
                      </Box>
                      <Typography fontWeight={700} variant="h6" mb={1}>
                        {course.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {course.description?.slice(0, 80)}...
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Progress
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {course.progress.toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={course.progress}
                          sx={{ height: 8, borderRadius: 1 }}
                        />
                      </Box>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button 
                        fullWidth 
                        variant="contained"
                        onClick={() => navigate(`/courses/${course.id}`)}
                      >
                        {course.progress === 100 ? 'Review Course' : 'Continue Learning'}
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Quick Actions */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'primary.main', color: 'white', cursor: 'pointer' }}
              onClick={() => navigate('/recommendations')}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={1}>
                  🤖 AI Recommendations
                </Typography>
                <Typography variant="body2">
                  Get personalized course suggestions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'success.main', color: 'white', cursor: 'pointer' }}
              onClick={() => navigate('/progress')}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={1}>
                  📊 View Progress
                </Typography>
                <Typography variant="body2">
                  Track your learning journey
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'info.main', color: 'white', cursor: 'pointer' }}
              onClick={() => navigate('/profile')}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={1}>
                  👤 My Profile
                </Typography>
                <Typography variant="body2">
                  View account and history
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
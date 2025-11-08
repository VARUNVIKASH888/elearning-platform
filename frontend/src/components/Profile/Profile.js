import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Avatar, Grid,
  Divider, List, ListItem, ListItemText, Chip, CircularProgress
} from '@mui/material';
import Navbar from '../Common/Navbar';
import { progressAPI, coursesAPI } from '../../services/api';

const Profile = ({ user, onLogout }) => {
  const [activityHistory, setActivityHistory] = useState([]);
  const [stats, setStats] = useState({
    totalLessons: 0,
    completedLessons: 0,
    totalTime: 0,
    coursesEnrolled: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all courses
        const coursesRes = await coursesAPI.getAll();
        
        // Get progress for all courses
        let allProgress = [];
        let coursesEnrolled = 0;
        
        for (const course of coursesRes) {
          try {
            const progress = await progressAPI.getCourseProgress(course.id);
            if (progress && progress.length > 0) {
              coursesEnrolled++;
              allProgress = [...allProgress, ...progress.map(p => ({ 
                ...p, 
                courseName: course.title 
              }))];
            }
          } catch (err) {
            // Not enrolled
          }
        }
        
        // Calculate stats
        const totalLessons = allProgress.length;
        const completedLessons = allProgress.filter(p => p.completion_status === 'completed').length;
        const totalTime = allProgress.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0);
        
        setStats({
          totalLessons,
          completedLessons,
          totalTime,
          coursesEnrolled
        });
        
        // Recent activity (last 10 completed lessons)
        const recentActivity = allProgress
          .filter(p => p.completion_status === 'completed')
          .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
          .slice(0, 10);
        
        setActivityHistory(recentActivity);
      } catch (err) {
        console.error('Error fetching profile data:', err);
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
      <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h4" fontWeight={700} mb={4}>
          My Profile
        </Typography>

        <Grid container spacing={3}>
          {/* Profile Info */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar 
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    mx: 'auto', 
                    mb: 2,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem'
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h5" fontWeight={600} mb={1}>
                  {user.name}
                </Typography>
                <Typography color="text.secondary" mb={1}>
                  {user.email}
                </Typography>
                <Chip label={user.role.toUpperCase()} color="primary" size="small" />
              </CardContent>
            </Card>

            {/* Stats */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Learning Stats
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Courses Enrolled
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {stats.coursesEnrolled}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Lessons Completed
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {stats.completedLessons} / {stats.totalLessons}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Time Spent
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="info.main">
                    {Math.round(stats.totalTime / 60)}h
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stats.totalTime} minutes
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Activity History */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={3}>
                  Recent Activity
                </Typography>
                {activityHistory.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" py={4}>
                    No activity yet. Start learning to see your history!
                  </Typography>
                ) : (
                  <List>
                    {activityHistory.map((activity, idx) => (
                      <React.Fragment key={idx}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Typography fontWeight={600}>
                                ‚úÖ Completed lesson in {activity.courseName}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Time spent: {activity.time_spent_minutes} minutes
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {activity.completed_at 
                                    ? new Date(activity.completed_at).toLocaleDateString()
                                    : 'Recently'
                                  }
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {idx < activityHistory.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>

            {/* Achievements (Optional) */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Achievements
                </Typography>
                <Grid container spacing={2}>
                  {stats.completedLessons >= 10 && (
                    <Grid item xs={6} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                        <Typography variant="h3">ÌæØ</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          10 Lessons
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  {stats.coursesEnrolled >= 3 && (
                    <Grid item xs={6} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
                        <Typography variant="h3">Ì≥ö</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          3 Courses
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  {stats.totalTime >= 300 && (
                    <Grid item xs={6} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                        <Typography variant="h3">‚è±Ô∏è</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          5+ Hours
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Profile;

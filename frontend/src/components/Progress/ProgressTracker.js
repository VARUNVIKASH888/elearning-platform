import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, CircularProgress, Grid, LinearProgress
} from '@mui/material';
import Navbar from '../Common/Navbar';

const ProgressTracker = ({ user, onLogout }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const coursesRes = await fetch('http://localhost:8000/api/courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const courses = await coursesRes.json();
        if (!Array.isArray(courses)) { setEnrollments([]); return; }

        const result = [];
        for (const course of courses) {
          const res = await fetch(`http://localhost:8000/api/progress/course/${course.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const prog = await res.json();
            if (Array.isArray(prog) && prog.length > 0) {
              const completed = prog.filter(p => p.completion_status === 'completed').length;
              const pct = (completed / prog.length) * 100;
              result.push({
                id: course.id,
                course_id: course.id,
                course: { title: course.title },
                progress_percentage: pct
              });
            }
          }
        }
        setEnrollments(result);
      } catch (err) {
        console.error(err);
        setEnrollments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [token]);

  const avg = enrollments.length
    ? (enrollments.reduce((s, e) => s + (e.progress_percentage || 0), 0) / enrollments.length).toFixed(1)
    : 0;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar user={user} onLogout={onLogout} />
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight={700} mb={1}>My Progress</Typography>
        <Typography color="text.secondary" mb={4}>Track your learning journey</Typography>

        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Overall Average</Typography>
                <Typography variant="h4" fontWeight={700} color="primary.main">{avg}%</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Enrolled Courses</Typography>
                <Typography variant="h4" fontWeight={700} color="secondary.main">{enrollments.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Completed</Typography>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {enrollments.filter(e => e.progress_percentage === 100).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="h5" fontWeight={600} mb={2}>Course Progress</Typography>
        {loading ? <CircularProgress /> : (
          <Grid container spacing={2}>
            {enrollments.length === 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      No courses enrolled yet — go to Courses to get started!
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
            {enrollments.map(e => (
              <Grid item xs={12} sm={6} key={e.id}>
                <Card>
                  <CardContent>
                    <Typography fontWeight={600} mb={1}>
                      {e.course?.title || `Course ${e.course_id}`}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={e.progress_percentage || 0}
                        sx={{ flexGrow: 1, borderRadius: 1, height: 10 }}
                      />
                      <Typography variant="body2" fontWeight={600}>
                        {(e.progress_percentage || 0).toFixed(0)}%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default ProgressTracker;
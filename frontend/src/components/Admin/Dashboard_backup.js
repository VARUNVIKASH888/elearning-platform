import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, CircularProgress,
  Tab, Tabs, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Avatar, Alert
} from '@mui/material';
import Navbar from '../Common/Navbar';

const StatCard = ({ icon, label, value, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary" mb={1}>{icon} {label}</Typography>
      <Typography variant="h3" fontWeight={700} color={color}>{value ?? '–'}</Typography>
    </CardContent>
  </Card>
);

const RiskChip = ({ level }) => {
  const colors = { low: 'success', medium: 'warning', high: 'error', unknown: 'default' };
  return <Chip label={level?.toUpperCase() || 'UNKNOWN'} color={colors[level] || 'default'} size="small" />;
};

const AdminDashboard = ({ user, onLogout }) => {
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [dropoutData, setDropoutData] = useState({});
  const [loading, setLoading] = useState(true);
  const [riskLoading, setRiskLoading] = useState(false);
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, coursesRes] = await Promise.all([
          fetch('http://localhost:8000/api/analytics/dashboard', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('http://localhost:8000/api/courses', {
            headers: { Authorization: `Bearer ${token}` }
          }),
        ]);
        const statsData = await statsRes.json();
        const coursesData = await coursesRes.json();
        setStats(statsData);
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Fetch students + dropout risk when tab 1 is opened
  useEffect(() => {
    if (tab !== 1 || students.length > 0) return;
    const fetchStudentRisk = async () => {
      setRiskLoading(true);
      try {
        // Get all users from courses progress data
        const progressRes = await fetch('http://localhost:8000/api/analytics/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Use ML API to get student list from DB directly
        // We'll use the courses to find enrolled students
        const coursesRes = await fetch('http://localhost:8000/api/courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const coursesData = await coursesRes.json();

        // Get progress for each course to find students
        const studentMap = {};
        for (const course of (coursesData || []).slice(0, 5)) {
          const progRes = await fetch(
            `http://localhost:8000/api/progress/course/${course.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (progRes.ok) {
            const progData = await progRes.json();
            for (const p of (progData || [])) {
              if (!studentMap[p.user_id]) {
                studentMap[p.user_id] = {
                  id: p.user_id,
                  courses: new Set(),
                  completed: 0,
                  total: 0
                };
              }
              studentMap[p.user_id].courses.add(course.id);
              studentMap[p.user_id].total++;
              if (p.completion_status === 'completed') {
                studentMap[p.user_id].completed++;
              }
            }
          }
        }

        // Get dropout prediction for each student from ML API
        const studentList = Object.values(studentMap);
        setStudents(studentList);

        const riskResults = {};
        for (const student of studentList) {
          try {
            const res = await fetch('http://localhost:8001/api/ml/predict-dropout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_data: { user_id: student.id }
              })
            });
            if (res.ok) {
              const data = await res.json();
              riskResults[student.id] = data;
            }
          } catch (err) {
            console.error('Risk prediction error for', student.id);
          }
        }
        setDropoutData(riskResults);
      } catch (err) {
        console.error('Student risk fetch error:', err);
      } finally {
        setRiskLoading(false);
      }
    };
    fetchStudentRisk();
  }, [tab, token]);

  const statCards = [
    { icon: '👥', label: 'Total Users', value: stats?.total_users, color: 'primary.main' },
    { icon: '📚', label: 'Total Courses', value: stats?.total_courses, color: 'secondary.main' },
    { icon: '🎓', label: 'Total Enrollments', value: stats?.total_enrollments, color: 'success.main' },
    { icon: '🟢', label: 'Active Today', value: stats?.active_users_today, color: 'warning.main' },
    { icon: '📝', label: 'Quiz Attempts', value: stats?.total_quiz_attempts, color: 'info.main' },
    {
      icon: '🏆', label: 'Avg Quiz Score',
      value: stats?.average_quiz_score != null
        ? `${Number(stats.average_quiz_score).toFixed(1)}%` : '–',
      color: 'error.main'
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar user={user} onLogout={onLogout} />
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight={700} mb={1}>Admin Dashboard</Typography>
        <Typography color="text.secondary" mb={3}>
          Platform management and AI-powered student insights
        </Typography>

        {loading ? <CircularProgress /> : (
          <>
            {/* Stats Overview - always visible */}
            <Grid container spacing={2} mb={4}>
              {statCards.map(card => (
                <Grid item xs={6} sm={4} md={2} key={card.label}>
                  <StatCard {...card} />
                </Grid>
              ))}
            </Grid>

            {/* Tabs */}
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
              <Tab label="📊 Course Performance" />
              <Tab label="🚨 Student Risk (AI)" />
              <Tab label="👥 All Users" />
            </Tabs>

            {/* Tab 0 — Course Performance */}
            {tab === 0 && (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell><strong>Course</strong></TableCell>
                      <TableCell><strong>Category</strong></TableCell>
                      <TableCell><strong>Difficulty</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {courses.map(course => (
                      <TableRow key={course.id} hover>
                        <TableCell>
                          <Typography fontWeight={600}>{course.title}</Typography>
                        </TableCell>
                        <TableCell>{course.category || '–'}</TableCell>
                        <TableCell>
                          <Chip
                            label={course.difficulty_level}
                            size="small"
                            color={
                              course.difficulty_level === 'beginner' ? 'success' :
                              course.difficulty_level === 'intermediate' ? 'warning' : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={course.is_published ? '✓ Published' : 'Draft'}
                            size="small"
                            color={course.is_published ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Tab 1 — Student Risk */}
            {tab === 1 && (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  🤖 Dropout risk is calculated by the AI model based on login frequency,
                  completion rate, quiz scores and time spent.
                </Alert>
                {riskLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                    <CircularProgress size={24} />
                    <Typography>Analyzing student risk levels...</Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                          <TableCell><strong>Student</strong></TableCell>
                          <TableCell><strong>Courses</strong></TableCell>
                          <TableCell><strong>Completion</strong></TableCell>
                          <TableCell><strong>Risk Level</strong></TableCell>
                          <TableCell><strong>Risk Score</strong></TableCell>
                          <TableCell><strong>Key Factor</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {students.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              <Typography color="text.secondary" py={2}>
                                No student data available
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          students.map(student => {
                            const risk = dropoutData[student.id];
                            const pct = student.total > 0
                              ? Math.round((student.completed / student.total) * 100) : 0;
                            return (
                              <TableRow key={student.id} hover
                                sx={{
                                  bgcolor: risk?.risk_level === 'high'
                                    ? 'error.50' : 'transparent'
                                }}>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar sx={{ width: 32, height: 32, fontSize: 14,
                                      bgcolor: 'primary.main' }}>
                                      {student.id.slice(0, 2).toUpperCase()}
                                    </Avatar>
                                    <Typography variant="body2" fontFamily="monospace">
                                      {student.id.slice(0, 8)}...
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>{student.courses.size}</TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{
                                      width: 60, height: 6, bgcolor: 'grey.200',
                                      borderRadius: 1, overflow: 'hidden'
                                    }}>
                                      <Box sx={{
                                        width: `${pct}%`, height: '100%',
                                        bgcolor: pct > 60 ? 'success.main' : 'warning.main'
                                      }} />
                                    </Box>
                                    <Typography variant="body2">{pct}%</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <RiskChip level={risk?.risk_level} />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={600}
                                    color={risk?.dropout_risk > 0.6 ? 'error.main' : 'text.primary'}>
                                    {risk ? `${Math.round(risk.dropout_risk * 100)}%` : '–'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="text.secondary">
                                    {risk?.contributing_factors?.[0] || '–'}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}

            {/* Tab 2 — All Users */}
            {tab === 2 && (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell><strong>Name / ID</strong></TableCell>
                      <TableCell><strong>Role</strong></TableCell>
                      <TableCell><strong>Courses</strong></TableCell>
                      <TableCell><strong>AI Risk</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography color="text.secondary" py={2}>
                            Switch to Student Risk tab first to load user data
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map(student => {
                        const risk = dropoutData[student.id];
                        return (
                          <TableRow key={student.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace">
                                {student.id}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label="student" size="small" color="primary" />
                            </TableCell>
                            <TableCell>{student.courses.size}</TableCell>
                            <TableCell>
                              <RiskChip level={risk?.risk_level} />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default AdminDashboard; 
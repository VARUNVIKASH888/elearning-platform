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
  const colors = { low: 'success', medium: 'warning', high: 'error' };
  return (
    <Chip
      label={level?.toUpperCase() || 'UNKNOWN'}
      color={colors[level] || 'default'}
      size="small"
    />
  );
};

const AdminDashboard = ({ user, onLogout }) => {
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [dropoutData, setDropoutData] = useState({});
  const [loading, setLoading] = useState(true);
  const [riskLoading, setRiskLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const token = localStorage.getItem('access_token');

  // Load stats and courses on mount
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
        setStats(await statsRes.json());
        const c = await coursesRes.json();
        setCourses(Array.isArray(c) ? c : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Load students + dropout risk when tab 1 selected
  useEffect(() => {
    if (tab !== 1 || students.length > 0) return;
    const fetchStudentRisk = async () => {
      setRiskLoading(true);
      try {
        const res = await fetch('http://localhost:8000/api/admin/students', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : []);

        // Get dropout risk for each student from ML API
        const riskResults = {};
        for (const student of (Array.isArray(data) ? data : [])) {
          try {
            const riskRes = await fetch('http://localhost:8001/api/ml/predict-dropout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_data: { user_id: student.id } })
            });
            if (riskRes.ok) {
              riskResults[student.id] = await riskRes.json();
            }
          } catch (err) {
            console.error('Risk error for', student.id);
          }
        }
        setDropoutData(riskResults);
      } catch (err) {
        console.error('Students fetch error:', err);
      } finally {
        setRiskLoading(false);
      }
    };
    fetchStudentRisk();
  }, [tab, token]);

  // Load all users when tab 2 selected
  useEffect(() => {
    if (tab !== 2 || allUsers.length > 0) return;
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const res = await fetch('http://localhost:8000/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setAllUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Users fetch error:', err);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, [tab, token]);

  const statCards = [
    { icon: '👥', label: 'Total Users', value: stats?.total_users, color: 'primary.main' },
    { icon: '📚', label: 'Total Courses', value: stats?.total_courses, color: 'secondary.main' },
    { icon: '🎓', label: 'Enrollments', value: stats?.total_enrollments, color: 'success.main' },
    { icon: '🟢', label: 'Active Today', value: stats?.active_users_today, color: 'warning.main' },
    { icon: '📝', label: 'Quiz Attempts', value: stats?.total_quiz_attempts, color: 'info.main' },
    {
      icon: '🏆', label: 'Avg Quiz Score',
      value: stats?.average_quiz_score != null
        ? `${Number(stats.average_quiz_score).toFixed(1)}%` : '–',
      color: 'error.main'
    },
  ];

  const roleColor = { admin: 'error', instructor: 'warning', student: 'primary' };

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
            {/* Stats Bar */}
            <Grid container spacing={2} mb={4}>
              {statCards.map(card => (
                <Grid item xs={6} sm={4} md={2} key={card.label}>
                  <StatCard {...card} />
                </Grid>
              ))}
            </Grid>

            {/* Tabs */}
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
              <Tab label="📚 Course Performance" />
              <Tab label="🚨 Student Risk (AI)" />
              <Tab label="👥 User Management" />
            </Tabs>

            {/* Tab 0 — Course Performance */}
            {tab === 0 && (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell><strong>Course Title</strong></TableCell>
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
                  🤖 Dropout risk is calculated in real-time by the AI model based on
                  login frequency, completion rate, quiz scores and time spent per lesson.
                </Alert>
                {riskLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
                    <CircularProgress size={24} />
                    <Typography color="text.secondary">
                      Running AI dropout analysis on {stats?.total_users} students...
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                          <TableCell><strong>Student</strong></TableCell>
                          <TableCell><strong>Email</strong></TableCell>
                          <TableCell><strong>Courses</strong></TableCell>
                          <TableCell><strong>Completion</strong></TableCell>
                          <TableCell><strong>Risk Level</strong></TableCell>
                          <TableCell><strong>Risk Score</strong></TableCell>
                          <TableCell><strong>Key Factor</strong></TableCell>
                          <TableCell><strong>Last Login</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {students.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} align="center">
                              <Typography color="text.secondary" py={3}>
                                No student data available
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          // Sort by risk score descending
                          [...students]
                            .sort((a, b) => {
                              const rA = dropoutData[a.id]?.dropout_risk || 0;
                              const rB = dropoutData[b.id]?.dropout_risk || 0;
                              return rB - rA;
                            })
                            .map(student => {
                              const risk = dropoutData[student.id];
                              const pct = Math.round(student.completion_rate * 100);
                              const lastLogin = student.last_login
                                ? new Date(student.last_login).toLocaleDateString()
                                : 'Never';
                              return (
                                <TableRow
                                  key={student.id} hover
                                  sx={{
                                    bgcolor: risk?.risk_level === 'high'
                                      ? '#fff5f5' : 'transparent'
                                  }}
                                >
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Avatar sx={{
                                        width: 34, height: 34,
                                        bgcolor: risk?.risk_level === 'high'
                                          ? 'error.main'
                                          : risk?.risk_level === 'medium'
                                          ? 'warning.main' : 'success.main',
                                        fontSize: 14
                                      }}>
                                        {student.name?.charAt(0) || '?'}
                                      </Avatar>
                                      <Typography fontWeight={600} variant="body2">
                                        {student.name}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                      {student.email}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    {student.courses_enrolled}
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Box sx={{
                                        width: 60, height: 6,
                                        bgcolor: 'grey.200', borderRadius: 1
                                      }}>
                                        <Box sx={{
                                          width: `${pct}%`, height: '100%',
                                          bgcolor: pct > 60 ? 'success.main' : 'warning.main',
                                          borderRadius: 1
                                        }} />
                                      </Box>
                                      <Typography variant="body2">{pct}%</Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <RiskChip level={risk?.risk_level} />
                                  </TableCell>
                                  <TableCell>
                                    <Typography
                                      variant="body2" fontWeight={700}
                                      color={
                                        risk?.dropout_risk > 0.6 ? 'error.main' :
                                        risk?.dropout_risk > 0.3 ? 'warning.main' : 'success.main'
                                      }
                                    >
                                      {risk ? `${Math.round(risk.dropout_risk * 100)}%` : '–'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                      {risk?.contributing_factors?.[0] || 'Student is engaged'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                      {lastLogin}
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

            {/* Tab 2 — User Management */}
            {tab === 2 && (
              <>
                {usersLoading ? <CircularProgress /> : (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                          <TableCell><strong>Name</strong></TableCell>
                          <TableCell><strong>Email</strong></TableCell>
                          <TableCell><strong>Role</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell><strong>Last Login</strong></TableCell>
                          <TableCell><strong>Joined</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allUsers.map(u => (
                          <TableRow key={u.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{
                                  width: 32, height: 32, fontSize: 13,
                                  bgcolor: u.role === 'admin' ? 'error.main' :
                                    u.role === 'instructor' ? 'warning.main' : 'primary.main'
                                }}>
                                  {u.name?.charAt(0) || '?'}
                                </Avatar>
                                <Typography fontWeight={600} variant="body2">{u.name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={u.role}
                                size="small"
                                color={roleColor[u.role] || 'default'}
                                sx={{ textTransform: 'capitalize' }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={u.is_active ? 'Active' : 'Inactive'}
                                size="small"
                                color={u.is_active ? 'success' : 'default'}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {u.last_login
                                  ? new Date(u.last_login).toLocaleDateString()
                                  : 'Never'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {u.created_at
                                  ? new Date(u.created_at).toLocaleDateString()
                                  : '–'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default AdminDashboard;
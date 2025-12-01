import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button,
  Table, TableBody, TableCell, TableHead, TableRow,
  Chip, CircularProgress, Alert, Tabs, Tab
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Common/Navbar';
import { coursesAPI, mlAPI } from '../../services/api';

const InstructorDashboard = ({ user, onLogout }) => {
  const [myCourses, setMyCourses] = useState([]);
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch courses taught by this instructor
        const coursesRes = await coursesAPI.getAll();
        const instructorCourses = coursesRes.filter(c => c.instructor_id === user.id);
        setMyCourses(instructorCourses);

        // Get enrolled students and check dropout risk
        // (In real app, you'd have an endpoint for this)
        const riskStudents = [];
        
        // Mock data for demo - in production, fetch real student data
        const mockStudents = [
          {
            id: '1',
            name: 'John Student',
            email: 'student1@test.com',
            course: 'Introduction to Python',
            risk_level: 'high',
            risk_score: 0.75,
            last_login: '10 days ago'
          },
          {
            id: '2',
            name: 'Jane Learner',
            email: 'student2@test.com',
            course: 'React Development',
            risk_level: 'medium',
            risk_score: 0.45,
            last_login: '3 days ago'
          }
        ];
        
        setAtRiskStudents(mockStudents);
      } catch (err) {
        console.error('Error fetching instructor data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const getRiskColor = (level) => {
    switch (level) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

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
        <Typography variant="h4" fontWeight={700} mb={1}>
          Instructor Dashboard Ì±®‚ÄçÌø´
        </Typography>
        <Typography color="text.secondary" mb={4}>
          Manage your courses and monitor student progress
        </Typography>

        {/* Stats */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">My Courses</Typography>
                <Typography variant="h3" fontWeight={700} color="primary.main">
                  {myCourses.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">At-Risk Students</Typography>
                <Typography variant="h3" fontWeight={700} color="error.main">
                  {atRiskStudents.filter(s => s.risk_level === 'high').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Total Enrollments</Typography>
                <Typography variant="h3" fontWeight={700} color="success.main">
                  {myCourses.reduce((sum, c) => sum + (c.enrollment_count || 0), 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
            <Tab label="My Courses" />
            <Tab label="At-Risk Students Ì∫®" />
            <Tab label="Analytics" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {tab === 0 && (
          <Grid container spacing={3}>
            {myCourses.length === 0 ? (
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary" mb={2}>
                      You haven't created any courses yet
                    </Typography>
                    <Button variant="contained">Create Course</Button>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              myCourses.map(course => (
                <Grid item xs={12} sm={6} md={4} key={course.id}>
                  <Card>
                    <CardContent>
                      <Typography fontWeight={700} variant="h6" mb={1}>
                        {course.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {course.description?.slice(0, 100)}...
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Enrollments: {course.enrollment_count || 0}</Typography>
                        <Chip label={course.difficulty_level} size="small" />
                      </Box>
                      <Button fullWidth variant="outlined" onClick={() => navigate(`/courses/${course.id}`)}>
                        View Course
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}

        {tab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={3}>
                Ì¥ñ AI-Powered Dropout Risk Assessment
              </Typography>
              {atRiskStudents.length === 0 ? (
                <Alert severity="success">
                  Great news! No students are currently at risk of dropping out.
                </Alert>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Student</strong></TableCell>
                      <TableCell><strong>Course</strong></TableCell>
                      <TableCell><strong>Risk Level</strong></TableCell>
                      <TableCell><strong>Risk Score</strong></TableCell>
                      <TableCell><strong>Last Login</strong></TableCell>
                      <TableCell><strong>Action</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {atRiskStudents.map(student => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Typography fontWeight={600}>{student.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {student.email}
                          </Typography>
                        </TableCell>
                        <TableCell>{student.course}</TableCell>
                        <TableCell>
                          <Chip 
                            label={student.risk_level.toUpperCase()}
                            color={getRiskColor(student.risk_level)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{(student.risk_score * 100).toFixed(0)}%</TableCell>
                        <TableCell>{student.last_login}</TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined">
                            Contact
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {tab === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Course Analytics
              </Typography>
              <Typography color="text.secondary">
                Analytics dashboard coming soon...
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default InstructorDashboard;

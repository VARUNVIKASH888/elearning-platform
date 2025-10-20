import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button,
  TextField, CircularProgress, Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Common/Navbar';

const CourseList = ({ user, onLogout }) => {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8000/api/courses/', {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    })
      .then(r => r.json())
      .then(data => setCourses(Array.isArray(data) ? data : []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar user={user} onLogout={onLogout} />
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight={700} mb={3}>All Courses</Typography>
        <TextField
          fullWidth placeholder="Search courses..." value={search}
          onChange={e => setSearch(e.target.value)} sx={{ mb: 3 }}
        />
        {loading ? <CircularProgress /> : (
          <Grid container spacing={3}>
            {filtered.length === 0 && (
              <Grid item xs={12}>
                <Typography color="text.secondary" textAlign="center">No courses found</Typography>
              </Grid>
            )}
            {filtered.map(course => (
              <Grid item xs={12} sm={6} md={4} key={course.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography fontWeight={700} variant="h6" mb={1}>{course.title}</Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {course.description?.slice(0, 100)}...
                    </Typography>
                    <Chip label={course.difficulty_level || 'Beginner'} size="small" sx={{ mb: 2 }} />
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button fullWidth variant="contained"
                      onClick={() => navigate(`/courses/${course.id}`)}>
                      View Course
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default CourseList;
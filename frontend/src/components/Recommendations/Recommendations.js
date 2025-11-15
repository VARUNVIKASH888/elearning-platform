import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button,
  CircularProgress, Grid, Chip, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Common/Navbar';

const Recommendations = ({ user, onLogout }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        console.log('Fetching recs for user:', user?.id);

        const res = await fetch('http://localhost:8001/api/ml/recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            user_id: user?.id,
            top_n: 4
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Failed to fetch recommendations');
        }

        const data = await res.json();
        console.log('Recommendations response:', data);
        setRecommendations(data.recommendations || []);
      } catch (err) {
        console.error('Recommendations error:', err);
        setError(err.message);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchRecs();
    } else {
      setLoading(false);
      setError('User not identified');
    }
  }, [user, token]);

  const getScoreColor = (score) => {
    if (score >= 0.6) return 'success';
    if (score >= 0.3) return 'primary';
    return 'default';
  };

  const getScoreLabel = (score) => {
    if (score >= 0.6) return `${Math.round(score * 100)}% Match`;
    if (score >= 0.3) return `${Math.round(score * 100)}% Match`;
    if (score > 0) return `${Math.round(score * 100)}% Match`;
    return 'Suggested for you';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar user={user} onLogout={onLogout} />
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight={700} mb={1}>
          ✨ AI-Powered Recommendations
        </Typography>
        <Typography color="text.secondary" mb={4}>
          Courses picked for you based on your learning patterns
        </Typography>

        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error} — showing fallback suggestions
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {recommendations.length === 0 ? (
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h6" mb={1}>
                      🎓 You're enrolled in all available courses!
                    </Typography>
                    <Typography color="text.secondary" mb={3}>
                      Complete more lessons to improve your recommendations,
                      or check back when new courses are added.
                    </Typography>
                    <Button variant="contained" onClick={() => navigate('/courses')}>
                      Browse All Courses
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              recommendations.map((rec, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Card sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                  }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          label={getScoreLabel(rec.score)}
                          color={getScoreColor(rec.score)}
                          size="small"
                        />
                        {rec.difficulty && (
                          <Chip label={rec.difficulty} size="small" variant="outlined" />
                        )}
                        {rec.category && (
                          <Chip label={rec.category} size="small" variant="outlined" />
                        )}
                      </Box>
                      <Typography fontWeight={700} variant="h6" mb={1}>
                        {rec.title || 'Recommended Course'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {rec.reason || 'Based on your learning history'}
                      </Typography>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => navigate(`/courses/${rec.course_id}`)}
                      >
                        View Course
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default Recommendations;
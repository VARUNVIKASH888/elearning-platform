import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../Common/Navbar';
import { toast } from 'react-toastify';

const LessonViewer = ({ user, onLogout }) => {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    fetch(`http://localhost:8000/api/lessons/${lessonId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setLesson)
      .catch(() => setLesson(null))
      .finally(() => setLoading(false));
  }, [lessonId, token]);

  const markComplete = async () => {
    try {
        const res = await fetch('http://localhost:8000/api/progress', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({
                lesson_id: lesson.id,
                completion_status: 'completed',
                time_spent_minutes: 5
            })
        });
        if (res.ok) {
            toast.success('Lesson marked as complete! ✅');
            navigate(-1);
        } else {
          const d = await res.json();
          toast.error(d.detail || 'Could not mark complete');
        }
    } catch {
      toast.error('Could not mark complete');
    }
};

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (!lesson) return <Alert severity="error" sx={{ m: 4 }}>Lesson not found</Alert>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar user={user} onLogout={onLogout} />
      <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>← Back</Button>
        <Card>
          <CardContent>
            <Typography variant="h4" fontWeight={700} mb={1}>{lesson.title}</Typography>
            <Typography variant="caption" color="text.secondary" mb={3} display="block">
              {lesson.lesson_type?.toUpperCase()}
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 4 }}>
              {lesson.content || 'No content available for this lesson.'}
            </Typography>
            {lesson.video_url && (
              <Box mb={3}>
                <video width="100%" controls src={lesson.video_url} />
              </Box>
            )}
            <Button variant="contained" size="large" onClick={markComplete}>
              Mark as Complete ✓
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default LessonViewer;
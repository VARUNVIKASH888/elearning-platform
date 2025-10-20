import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button,
  List, ListItem, ListItemText, Divider, CircularProgress, Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../Common/Navbar';
import { toast } from 'react-toastify';

const CourseDetail = ({ user, onLogout }) => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [lessonProgress, setLessonProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  const fetchProgress = async () => {
    try {
      const progRes = await fetch(`http://localhost:8000/api/progress/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (progRes.ok) {
        const progData = await progRes.json();
        // Create a map of lesson_id -> progress
        const progressMap = {};
        progData.forEach(p => {
          progressMap[p.lesson_id] = p;
        });
        setLessonProgress(progressMap);
        setEnrolled(progData.length > 0);
      } else {
        setLessonProgress({});
        setEnrolled(false);
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
      setLessonProgress({});
      setEnrolled(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch course
        const courseRes = await fetch(`http://localhost:8000/api/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const courseData = await courseRes.json();
        setCourse(courseData);

        // Fetch modules
        const modRes = await fetch(`http://localhost:8000/api/courses/${courseId}/modules`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const modData = await modRes.json();
        const mods = Array.isArray(modData) ? modData : [];

        // Fetch lessons for each module
        // Fetch lessons AND quizzes for each module
        const modsWithLessons = await Promise.all(mods.map(async (mod) => {
          try {
            const [lesRes, quizRes] = await Promise.all([
              fetch(`http://localhost:8000/api/modules/${mod.id}/lessons`, {
                headers: { Authorization: `Bearer ${token}` }
              }),
              fetch(`http://localhost:8000/api/modules/${mod.id}/quizzes`, {
                headers: { Authorization: `Bearer ${token}` }
              })
            ]);
            const lessons = await lesRes.json();
            const quizzes = await quizRes.json();
            return {
              ...mod,
              lessons: Array.isArray(lessons) ? lessons : [],
              quizId: Array.isArray(quizzes) && quizzes.length > 0 ? quizzes[0].id : null
            };
          } catch (err) {
            console.error('Error fetching module data:', mod.id, err);
            return { ...mod, lessons: [], quizId: null };
          }
        }));
        
        setModules(modsWithLessons.filter(m => m !== null));

        // Fetch progress
        await fetchProgress();
      } catch (err) {
        console.error('Error fetching course data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, token]);

  const handleEnroll = async () => {
    const allLessons = modules
      .flatMap(m => m.lessons || [])
      .filter(l => l && l.id)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    if (allLessons.length === 0) {
      toast.error('No lessons available in this course yet');
      return;
    }

    setEnrolling(true);
    try {
      const promises = allLessons.map(lesson =>
        fetch('http://localhost:8000/api/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            lesson_id: lesson.id,
            completion_status: 'not_started',
            time_spent_minutes: 0
          }),
        }).catch(err => {
          console.error('Failed to create progress for lesson:', lesson.id, err);
          return { ok: false };
        })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.ok).length;

      if (successCount > 0) {
        await fetchProgress();
        toast.success(`Enrolled successfully! ���`);
      } else {
        toast.error('Enrollment failed');
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      toast.error('Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar user={user} onLogout={onLogout} />
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    </Box>
  );

  if (!course) return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar user={user} onLogout={onLogout} />
      <Alert severity="error" sx={{ m: 4 }}>Course not found</Alert>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar user={user} onLogout={onLogout} />
      <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
        <Button onClick={() => navigate('/courses')} sx={{ mb: 2 }}>← Back to Courses</Button>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h4" fontWeight={700} mb={1}>{course.title || 'Course'}</Typography>
            <Typography color="text.secondary" mb={1}>{course.description || 'No description'}</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Difficulty: <strong>{course.difficulty_level || 'N/A'}</strong>
              {course.category && <> &nbsp;|&nbsp; Category: <strong>{course.category}</strong></>}
            </Typography>
            {!enrolled ? (
              <Button variant="contained" size="large" onClick={handleEnroll}
                disabled={enrolling || modules.length === 0}>
                {enrolling ? <CircularProgress size={20} /> : 'Enroll Now'}
              </Button>
            ) : (
              <Alert severity="success" sx={{ display: 'inline-flex' }}>
                ✅ You are enrolled — start learning below!
              </Alert>
            )}
          </CardContent>
        </Card>

        <Typography variant="h5" fontWeight={600} mb={2}>
          Course Content ({modules.length} modules)
        </Typography>

        {modules.length === 0 ? (
          <Typography color="text.secondary">No modules available yet</Typography>
        ) : (
          modules.filter(mod => mod && mod.title).map((mod, i) => (
            <Card key={mod.id || i} sx={{ mb: 2 }}>
              <CardContent>
                <Typography fontWeight={700} mb={1}>
                  Module {i + 1}: {mod.title || 'Untitled Module'}
                </Typography>
                {(!mod.lessons || mod.lessons.length === 0) ? (
                  <Typography variant="body2" color="text.secondary">No lessons yet</Typography>
                ) : (
                  <List dense disablePadding>
                    {mod.lessons.filter(lesson => lesson && lesson.id).map((lesson, li) => {
                      const progress = lessonProgress[lesson.id];
                      const isCompleted = progress?.completion_status === 'completed';
                      
                      return (
                        <React.Fragment key={lesson.id}>
                          <ListItem
                            sx={{ 
                              px: 0,
                              bgcolor: isCompleted ? 'success.light' : 'transparent',
                              borderRadius: 1,
                              mb: 0.5
                            }}
                            secondaryAction={
                              enrolled && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Button size="small" variant={isCompleted ? "text" : "outlined"}
                                    color={isCompleted ? "success" : "primary"}
                                    onClick={() => navigate(`/lessons/${lesson.id}`)}>
                                    {isCompleted ? '✓ Review' : 'Start'}
                                  </Button>
                                </Box>
                              )
                            }
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {isCompleted && <span>✅</span>}
                                  <span>{li + 1}. {lesson.title || 'Untitled Lesson'}</span>
                                </Box>
                              }
                              secondary={`${lesson.duration_minutes || 10} min`}
                            />
                          </ListItem>
                          {li < mod.lessons.length - 1 && <Divider />}
                        </React.Fragment>
                      );
                    })}
                  </List>
                )}
                {/* Take Quiz Button */}
                {enrolled && mod.quizId && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="small"
                      onClick={() => navigate(`/quiz/${mod.id}/${mod.quizId}`)}
                    >
                      📝 Take Quiz
                    </Button>
                  </Box>
                )}

              </CardContent>
            </Card>
          ))
        )}
      </Box>
    </Box>
  );
};

export default CourseDetail;

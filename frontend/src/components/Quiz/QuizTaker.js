/*
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
      await fetch(`http://localhost:8000/api/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Lesson marked as complete!');
      navigate(-1);
    } catch { toast.error('Could not mark complete'); }
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
*/

import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button,
  RadioGroup, FormControlLabel, Radio, CircularProgress,
  Alert, LinearProgress, Chip, Divider
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../Common/Navbar';
import { toast } from 'react-toastify';

const QuizTaker = ({ user, onLogout }) => {
  const { moduleId, quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        // Fetch questions for this quiz
        const res = await fetch(
          `http://localhost:8000/api/quizzes/${quizId}/questions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error('Quiz not found');
        const data = await res.json();
        setQuiz({ 
          id: quizId,
          title: data.quiz_title, 
          passing_score: data.passing_score,
          time_limit_minutes: data.time_limit_minutes
        });
        setQuestions(data.questions || []);
        // Set timer if time limit exists
        if (data.time_limit_minutes) {
          setTimeLeft(data.time_limit_minutes * 60);
        }
      } catch (err) {
        toast.error('Failed to load quiz');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId, token, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) {
      toast.warning('Time is up! Submitting quiz...');
      handleSubmit();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, submitted]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const submissionAnswers = questions.map(q => ({
        question_id: q.id,
        answer_option_id: answers[q.id] || null
      }));

      const res = await fetch('http://localhost:8000/api/quizzes/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quiz_id: quizId,
          answers: submissionAnswers
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Submission failed');
      }

      const data = await res.json();
      setResult(data);
      setSubmitted(true);
      toast.success('Quiz submitted!');
    } catch (err) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;
  const currentQ = questions[current];

  // ── Results Screen ──
  if (submitted && result) {
    const scorePercent = Number(result.score);
    const passed = result.passed;
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Navbar user={user} onLogout={onLogout} />
        <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 5 }}>
              <Typography variant="h3" mb={1}>
                {passed ? '🎉' : '📚'}
              </Typography>
              <Typography variant="h4" fontWeight={700} mb={1}>
                {passed ? 'Quiz Passed!' : 'Keep Practicing!'}
              </Typography>
              <Typography
                variant="h2"
                fontWeight={700}
                color={passed ? 'success.main' : 'warning.main'}
                mb={1}
              >
                {scorePercent.toFixed(0)}%
              </Typography>
              <Typography color="text.secondary" mb={1}>
                {result.total_points} points total
              </Typography>
              <Chip
                label={passed ? 'PASSED ✓' : `Need ${quiz?.passing_score}% to pass`}
                color={passed ? 'success' : 'warning'}
                sx={{ mb: 3 }}
              />
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="outlined" onClick={() => navigate(-1)}>
                  Back to Course
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    setSubmitted(false);
                    setResult(null);
                    setAnswers({});
                    setCurrent(0);
                    setTimeLeft(quiz?.time_limit_minutes ? quiz.time_limit_minutes * 60 : null);
                  }}
                >
                  Retake Quiz
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  }

  // ── Loading ──
  if (loading) return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar user={user} onLogout={onLogout} />
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    </Box>
  );

  // ── Quiz Screen ──
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar user={user} onLogout={onLogout} />
      <Box sx={{ p: 4, maxWidth: 750, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight={700}>{quiz?.title}</Typography>
          {timeLeft !== null && (
            <Chip
              label={`⏱ ${formatTime(timeLeft)}`}
              color={timeLeft < 60 ? 'error' : 'primary'}
              variant="outlined"
            />
          )}
        </Box>

        {/* Progress bar */}
        <Box sx={{ mb: 1 }}>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Question {current + 1} of {questions.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {answeredCount}/{questions.length} answered
            </Typography>
          </Box>
        </Box>

        {/* Question Card */}
        {currentQ && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Chip label={currentQ.difficulty_level} size="small" variant="outlined" />
                <Chip label={`${currentQ.points} pt`} size="small" color="primary" />
              </Box>
              <Typography variant="h6" mb={3} fontWeight={600}>
                {currentQ.question_text}
              </Typography>
              <RadioGroup
                value={answers[currentQ.id] || ''}
                onChange={e => handleAnswer(currentQ.id, e.target.value)}
              >
                {(currentQ.options || []).map((opt) => (
                  <FormControlLabel
                    key={opt.id}
                    value={opt.id}
                    control={<Radio />}
                    label={opt.option_text}
                    sx={{
                      mb: 1,
                      p: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: answers[currentQ.id] === opt.id
                        ? 'primary.main' : 'divider',
                      bgcolor: answers[currentQ.id] === opt.id
                        ? 'primary.50' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  />
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="outlined"
            disabled={current === 0}
            onClick={() => setCurrent(c => c - 1)}
          >
            ← Previous
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {questions.map((_, i) => (
              <Box
                key={i}
                onClick={() => setCurrent(i)}
                sx={{
                  width: 28, height: 28,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  bgcolor: answers[questions[i]?.id]
                    ? 'primary.main'
                    : i === current ? 'grey.300' : 'grey.100',
                  color: answers[questions[i]?.id] ? 'white' : 'text.primary',
                  border: i === current ? '2px solid' : 'none',
                  borderColor: 'primary.main',
                }}
              >
                {i + 1}
              </Box>
            ))}
          </Box>

          {current < questions.length - 1 ? (
            <Button
              variant="contained"
              onClick={() => setCurrent(c => c + 1)}
            >
              Next →
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleSubmit}
              disabled={submitting || answeredCount === 0}
            >
              {submitting ? <CircularProgress size={20} /> : 'Submit Quiz'}
            </Button>
          )}
        </Box>

        {/* Unanswered warning */}
        {answeredCount < questions.length && current === questions.length - 1 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            You have {questions.length - answeredCount} unanswered question(s).
            You can still submit but unanswered questions count as wrong.
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default QuizTaker;
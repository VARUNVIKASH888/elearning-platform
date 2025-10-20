// Replace the enrollment check section in useEffect with this:

// Check if already enrolled (check user's progress specifically)
try {
  const progRes = await fetch(`http://localhost:8000/api/progress/course/${courseId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (progRes.ok) {
    const progData = await progRes.json();
    // Only set enrolled if we have progress records
    setEnrolled(Array.isArray(progData) && progData.length > 0);
  } else {
    setEnrolled(false);
  }
} catch (err) {
  console.error('Error checking enrollment:', err);
  setEnrolled(false);
}

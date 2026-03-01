import { useState, useEffect } from 'react';
import { AlertCircle, Lock, CheckCircle, Clock, List } from 'lucide-react';
import { studentAPI } from '../../services/api';

export default function QuizModule({ studentId, showNotification }) {
  // Quiz list view
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  
  // Quiz take view
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [canTakeQuiz, setCanTakeQuiz] = useState(false);
  const [prerequisite, setPrerequisite] = useState(null);
  const [loading, setLoading] = useState(false);
  const [takingQuiz, setTakingQuiz] = useState(false);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  // Fetch available quizzes
  useEffect(() => {
    fetchAvailableQuizzes();
  }, []);

  // Timer effect for quiz
  useEffect(() => {
    if (takingQuiz && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (takingQuiz && timeLeft === 0 && !submitted) {
      handleSubmitQuiz();
    }
  }, [timeLeft, takingQuiz, submitted]);

  const fetchAvailableQuizzes = async () => {
    try {
      setLoadingQuizzes(true);
      // For now, show a message - in production this would fetch from backend
      const mockQuizzes = [
        { _id: '1', title: 'Mathematics Quiz', description: 'Basic algebra and geometry', duration: 30, questions: 10, course: 'Mathematics' },
        { _id: '2', title: 'Physics Quiz', description: 'Mechanics and kinematics', duration: 45, questions: 15, course: 'Physics' },
        { _id: '3', title: 'Chemistry Quiz', description: 'Periodic table and reactions', duration: 40, questions: 12, course: 'Chemistry' },
      ];
      setQuizzes(mockQuizzes);
      setLoadingQuizzes(false);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      showNotification('Failed to load quizzes. Please refresh the page.', 'error');
      setLoadingQuizzes(false);
    }
  };

  const handleSelectQuiz = async (quiz) => {
    try {
      setLoading(true);
      setSelectedQuiz(quiz);
      
      // Check prerequisite - for now mock it
      setCanTakeQuiz(true);
      setPrerequisite(null);
    } catch (err) {
      console.error('Error checking prerequisite:', err);
      showNotification('Failed to load quiz details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedQuiz(null);
    setResult(null);
    setSubmitted(false);
    setAnswers({});
  };

  const handleStartQuiz = async () => {
    try {
      // For now, start quiz locally - in production would call backend
      setTakingQuiz(true);
      setTimeLeft(selectedQuiz.duration * 60); // Convert minutes to seconds
      setAnswers({});
    } catch (err) {
      console.error('Error starting quiz:', err);
      showNotification('Failed to start quiz', 'error');
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitQuiz = async () => {
    try {
      setSubmitted(true);

      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        studentAnswer: answer
      }));

      const res = await studentAPI.submitQuizAttempt({
        answers: formattedAnswers
      });

      setResult(res.data.data);
      setTakingQuiz(false);
      showNotification('Quiz submitted successfully!', 'success');
    } catch (err) {
      console.error('Error submitting quiz:', err);
      showNotification('Failed to submit quiz', 'error');
      setSubmitted(false);
    }
  };

  // Show quiz list if no quiz selected
  if (!selectedQuiz) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Available Quizzes</h1>
          <p className="text-slate-600">Select a quiz to test your knowledge</p>
        </div>

        {loadingQuizzes ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-slate-600 mt-4">Loading quizzes...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-12 text-center border border-slate-200">
            <List className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">No quizzes available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map(quiz => (
              <div 
                key={quiz._id} 
                onClick={() => handleSelectQuiz(quiz)}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg cursor-pointer transition-all border border-slate-200 hover:border-purple-400"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">{quiz.title}</h3>
                  <Clock className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-slate-600 text-sm mb-4">{quiz.description}</p>
                <div className="flex gap-4 text-sm text-slate-600">
                  <span>⏱️ {quiz.duration} mins</span>
                  <span>❓ {quiz.questions} questions</span>
                </div>
                <div className="mt-4 text-xs text-slate-500">{quiz.course}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show quiz taking/results view
  if (loading) {
    return <div className="text-center py-8">Loading quiz details...</div>;
  }

  // Quiz Locked State
  if (!canTakeQuiz && !takingQuiz && !result) {
    return (
      <div className="space-y-4">
        <button
          onClick={handleBackToList}
          className="text-purple-600 hover:text-purple-700 text-sm font-medium mb-4"
        >
          ← Back to Quizzes
        </button>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <Lock className="w-6 h-6 text-yellow-600 mt-1 shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-900">Quiz Locked</h3>
              <p className="text-yellow-800 mt-1">
                You must complete the prerequisite module before taking this quiz.
              </p>
              {prerequisite && (
                <p className="text-sm text-yellow-700 mt-2">
                  Required: {prerequisite.title}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Details (before taking)
  if (!takingQuiz && !result) {
    return (
      <div className="space-y-6">
        <button
          onClick={handleBackToList}
          className="text-purple-600 hover:text-purple-700 text-sm font-medium mb-4"
        >
          ← Back to Quizzes
        </button>

        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{selectedQuiz?.title}</h1>
          <p className="text-slate-600 mb-6">{selectedQuiz?.description}</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600">Duration</p>
              <p className="text-2xl font-bold text-blue-600">{selectedQuiz?.duration} min</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600">Questions</p>
              <p className="text-2xl font-bold text-green-600">{selectedQuiz?.questions}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600">Passing Score</p>
              <p className="text-2xl font-bold text-purple-600">60%</p>
            </div>
          </div>

          <button
            onClick={handleStartQuiz}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  // Quiz Completed State
  if (result && !takingQuiz) {
    const isPassed = result.status === 'passed';
    return (
      <div className="space-y-6">
        <button
          onClick={handleBackToList}
          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
        >
          ← Back to Quizzes
        </button>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-center">
            {isPassed ? (
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            ) : (
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            )}

            <h2 className={`text-2xl font-bold mb-2 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
              {isPassed ? 'Quiz Passed!' : 'Quiz Failed'}
            </h2>

            <div className="bg-slate-100 rounded-lg p-6 my-6">
              <p className="text-4xl font-bold text-slate-900">{result.percentageScore?.toFixed(1) || 0}%</p>
              <p className="text-slate-600 mt-2">{result.score || 0} out of {result.totalMarks || 0} marks</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setResult(null);
                  setAnswers({});
                  setTakingQuiz(false);
                }}
                className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Retake Quiz
              </button>
              <button
                onClick={handleBackToList}
                className="flex-1 px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Back to List
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Taking Quiz State
  if (takingQuiz) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200">
          <h3 className="text-xl font-semibold text-slate-900">{quiz.title}</h3>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
          }`}>
            <Clock className="w-4 h-4" />
            <span className="font-mono font-semibold">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
          {quiz.questions.map((question, idx) => (
            <div key={question.id} className="border border-slate-200 rounded-lg p-4">
              <div className="mb-3">
                <p className="font-semibold text-slate-900">
                  {idx + 1}. {question.question}
                </p>
                <p className="text-xs text-slate-500 mt-1">{question.marks} marks</p>
              </div>

              {question.type === 'multiple-choice' && (
                <div className="space-y-2">
                  {question.options.map((option, optIdx) => (
                    <label key={optIdx} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-slate-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'short-answer' && (
                <input
                  type="text"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              )}

              {question.type === 'essay' && (
                <textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder="Type your answer..."
                  rows="4"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              setTakingQuiz(false);
              setAnswers({});
            }}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitQuiz}
            disabled={submitted}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {submitted ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      </div>
    );
  }

  // Ready to Take Quiz State
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">{quiz.title}</h2>
        {quiz.description && (
          <p className="text-slate-600 mt-2">{quiz.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600">Duration</p>
          <p className="text-xl font-semibold text-blue-900">{quiz.duration} min</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-600">Questions</p>
          <p className="text-xl font-semibold text-purple-900">{quiz.questions.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600">Total Marks</p>
          <p className="text-xl font-semibold text-green-900">{quiz.totalMarks}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-orange-600">Passing Score</p>
          <p className="text-xl font-semibold text-orange-900">{quiz.passingScore}%</p>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
        <p className="text-sm text-slate-700">
          <strong>Instructions:</strong> This quiz will be automatically submitted once the time runs out. Make sure you have a stable internet connection.
        </p>
      </div>

      <button
        onClick={handleStartQuiz}
        className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
      >
        Start Quiz
      </button>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, Award, Target } from 'lucide-react';
import { studentAPI } from '../../services/api';

export default function PerformanceAnalytics({ studentId, courseId }) {
  const [performance, setPerformance] = useState(null);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, [studentId, courseId]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      // Only fetch with courseId if it's available
      let perfRes, trendRes;
      if (courseId) {
        perfRes = await studentAPI.getStudentPerformance(studentId, courseId);
        trendRes = await studentAPI.getPerformanceTrend(studentId, courseId);
      } else {
        // Call endpoints without courseId
        perfRes = await studentAPI.getStudentPerformance(studentId);
        trendRes = await studentAPI.getPerformanceTrend(studentId);
      }
      setPerformance(perfRes.data.data);
      setTrend(trendRes.data.data);
    } catch (err) {
      console.error('Error fetching performance:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading performance data...</div>;
  }

  if (!performance) {
    return <div className="text-center py-12">No performance data available</div>;
  }

  const riskColors = {
    low: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    high: 'text-red-600 bg-red-50',
    critical: 'text-red-700 bg-red-100'
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Overall Score</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{performance.overallScore}%</p>
            </div>
            <Award className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Quiz Average</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {performance.tests.averageScore.toFixed(1)}%
              </p>
            </div>
            <Target className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Attendance</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {performance.attendance.percentage.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {performance.attendance.classesAttended}/{performance.attendance.totalClasses}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className={`p-6 rounded-xl shadow-md ${riskColors[performance.riskLevel]}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-75">Risk Level</p>
              <p className="text-2xl font-bold mt-1 capitalize">{performance.riskLevel}</p>
            </div>
            <AlertTriangle className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      {performance.riskFactors.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold text-amber-900 mb-3">Areas of Concern</h3>
          <div className="flex flex-wrap gap-2">
            {performance.riskFactors.map((factor, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full"
              >
                {factor}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quiz Scores Chart */}
        {performance.tests.scores.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="font-semibold text-slate-900 mb-4">Quiz Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performance.tests.scores.map((score, idx) => ({
                quiz: `Q${idx + 1}`,
                score: Math.round(score)
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quiz" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Assignment Scores Chart */}
        {performance.assignments.scores.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="font-semibold text-slate-900 mb-4">Assignment Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performance.assignments.scores.map((score, idx) => ({
                assignment: `A${idx + 1}`,
                score: Math.round(score)
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="assignment" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Trend Analysis */}
      {trend && trend.trend.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>Performance Trend (Improving)</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#8b5cf6" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Statistics */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="font-semibold text-slate-900 mb-4">Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-slate-600 text-sm">Assignments</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {performance.assignments.completed}/{performance.assignments.completed + performance.assignments.pending}
            </p>
            <p className="text-xs text-slate-500">Completed</p>
          </div>
          <div>
            <p className="text-slate-600 text-sm">Quizzes Taken</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{performance.tests.quizzesTaken}</p>
            <p className="text-xs text-slate-500">Attempts</p>
          </div>
          <div>
            <p className="text-slate-600 text-sm">Highest Quiz</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{performance.tests.highestScore.toFixed(1)}%</p>
            <p className="text-xs text-slate-500">Best score</p>
          </div>
          <div>
            <p className="text-slate-600 text-sm">Lowest Quiz</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{performance.tests.lowestScore.toFixed(1)}%</p>
            <p className="text-xs text-slate-500">Worst score</p>
          </div>
        </div>
      </div>
    </div>
  );
}

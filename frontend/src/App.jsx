import { useState } from 'react'
import './App.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import Login from './components/Login'
import Register from './components/Register'
import StudentDashboard from './pages/StudentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import AdminDashboard from './pages/AdminDashboard'

function AppContent() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleShowLogin = () => {
    setShowLogin(true);
    setShowRegister(false);
  };

  const handleShowRegister = () => {
    setShowRegister(true);
    setShowLogin(false);
  };

  const handleCloseModals = () => {
    setShowLogin(false);
    setShowRegister(false);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render dashboard based on user role
  if (user) {
    if (user.role === 'student') {
      return <StudentDashboard />;
    } else if (user.role === 'teacher') {
      return <TeacherDashboard />;
    } else if (user.role === 'admin') {
      return <AdminDashboard />;
    }
  }

  return (
    <>
      <LandingPage 
        onShowLogin={handleShowLogin} 
        onShowRegister={handleShowRegister} 
      />
      {showLogin && (
        <Login 
          onClose={handleCloseModals}
          onSwitchToRegister={handleShowRegister}
        />
      )}
      {showRegister && (
        <Register 
          onClose={handleCloseModals}
          onSwitchToLogin={handleShowLogin}
        />
      )}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

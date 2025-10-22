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
  const { user } = useAuth();
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

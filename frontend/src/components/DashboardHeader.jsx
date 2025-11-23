import { useState } from 'react';
import { GraduationCap, LogOut, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardHeader({ title, userRole }) {
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  // Role-based styling (using full class names for Tailwind)
  const roleStyles = {
    student: {
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      userIconColor: 'text-blue-600'
    },
    teacher: {
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
      userIconColor: 'text-green-600'
    },
    admin: {
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
      userIconColor: 'text-purple-600'
    }
  };

  const styles = roleStyles[userRole] || roleStyles.student;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 ml-5">
          {/* Left: Logo and Title */}
          <div className="flex items-center space-x-2">
            <GraduationCap className={`w-8 h-8 ${styles.iconColor}`} />
            <span className="text-xl font-bold text-slate-900">{title}</span>
          </div>

          {/* Right: User Info and Logout */}
          <div className="flex items-center space-x-4">
            {/* User Info */}
            <div className="flex items-center space-x-3 ">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user?.name || 'User'}</p>
                <div className="flex items-center justify-end gap-2">
                  <p className="text-xs text-slate-600">
                    {user?.studentId || user?.teacherId || 
                     userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </p>
                  {userRole === 'student' && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      <span>Grade {user?.grade || '—'}</span>
                      <span>•</span>
                      <span>Sec {user?.section || 'Not assigned'}</span>
                    </span>
                  )}
                </div>
              </div>
              <div className={`w-10 h-10 ${styles.bgColor} rounded-full flex items-center justify-center`}>
                <User className={`w-5 h-5 ${styles.userIconColor}`} />
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200 "
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-fade-in">
            <button
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Confirm Logout</h2>
                <p className="text-slate-600">Are you sure you want to logout?</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

import { GraduationCap, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardHeader({ title, userRole }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
    }
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
                <p className="text-xs text-slate-600">
                  {user?.studentId || user?.teacherId || 
                   userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </p>
              </div>
              <div className={`w-10 h-10 ${styles.bgColor} rounded-full flex items-center justify-center`}>
                <User className={`w-5 h-5 ${styles.userIconColor}`} />
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200 "
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

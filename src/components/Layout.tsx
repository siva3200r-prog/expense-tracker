import { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  Lightbulb,
  Target,
  LogOut,
  Wallet
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/add-expense', icon: PlusCircle, label: 'Add Expense' },
    { to: '/insights', icon: Lightbulb, label: 'AI Insights' },
    { to: '/goals', icon: Target, label: 'Goals' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Smart Expense Tracker
              </span>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`
                    }
                  >
                    <link.icon className="w-4 h-4" />
                    <span className="font-medium">{link.label}</span>
                  </NavLink>
                ))}
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="flex justify-around py-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 ${
                  isActive ? 'text-blue-600' : 'text-gray-600'
                }`
              }
            >
              <link.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{link.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

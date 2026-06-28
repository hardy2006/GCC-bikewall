import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const roleLabels: Record<string, string> = {
  customer: '客户',
  technician: '维修员',
  operator: '运营者',
};

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = () => {
    if (!user) return null;
    switch (user.role) {
      case 'customer':
        return (
          <>
            <Link to="/dashboard" className="text-white hover:text-blue-200 px-3 py-2">提交维修</Link>
            <Link to="/dashboard/my-orders" className="text-white hover:text-blue-200 px-3 py-2">我的订单</Link>
          </>
        );
      case 'technician':
        return (
          <>
            <Link to="/dashboard" className="text-white hover:text-blue-200 px-3 py-2">待接订单</Link>
            <Link to="/dashboard/my-tasks" className="text-white hover:text-blue-200 px-3 py-2">我的任务</Link>
          </>
        );
      case 'operator':
        return (
          <>
            <Link to="/dashboard" className="text-white hover:text-blue-200 px-3 py-2">全部订单</Link>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {user && (
        <nav className="bg-blue-600 shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className="text-white font-bold text-lg">
                  🚲 单车维修
                </Link>
                <div className="hidden md:flex space-x-1">
                  {navLinks()}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-blue-100 text-sm">
                  {roleLabels[user.role]}: {user.realName || user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-blue-700 hover:bg-blue-800 text-white text-sm px-3 py-1.5 rounded transition"
                >
                  退出
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}

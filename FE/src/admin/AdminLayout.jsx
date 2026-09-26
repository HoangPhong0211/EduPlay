import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import './AdminLayout.css';

export default function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Bảo vệ route: Chỉ cho phép người dùng có quyền Admin truy cập
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="admin-container">
      {/* Lớp nền mờ khi mở menu trên di động */}
      {isMobileMenuOpen && (
        <div className="admin-sidebar-backdrop" onClick={closeMobileMenu} />
      )}

      {/* Thanh điều hướng cố định bên trái */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h2>EduPlay Admin</h2>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <NavLink
                to="/admin/courses"
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={closeMobileMenu}
              >
                📚 Quản lý Khóa học
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/questions"
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={closeMobileMenu}
              >
                📝 Ngân hàng Câu hỏi
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/generate-test"
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={closeMobileMenu}
              >
                ⚙️ Sinh đề tự động
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/users"
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={closeMobileMenu}
              >
                👥 Quản lý Người dùng
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Vùng nội dung chính bên phải */}
      <main className="admin-main">
        {/* Header trên cùng */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button
              className="admin-mobile-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <h2>Bảng điều khiển Quản trị viên</h2>
          </div>

          <div className="admin-header-actions">
            <span className="admin-user-greeting">
              Xin chào, <strong>{user?.username}</strong>
            </span>
            <Link to="/" className="btn-view-site">
              🌐 Trang chủ
            </Link>
            <button onClick={handleLogout} className="btn-logout">
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Khu vực hiển thị nội dung động của từng trang con */}
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import './AdminLayout.css';

export default function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Bảo vệ route: Chỉ cho phép người dùng có quyền Admin truy cập
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'Admin') {
    if (user?.role === 'Parent') return <Navigate to="/parent" replace />;
    if (user?.role === 'Student') return <Navigate to="/student" replace />;
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Xác định tiêu đề và mô tả trang hiện tại dựa trên route
  const getPageInfo = () => {
    const path = location.pathname;
    if (path.includes('/admin/courses') || path === '/admin') {
      return {
        title: 'Quản lý Khóa học & Bài học',
        breadcrumb: 'Khóa học',
      };
    }
    if (path.includes('/admin/questions')) {
      return {
        title: 'Ngân hàng Câu hỏi',
        breadcrumb: 'Ngân hàng câu hỏi',
      };
    }
    if (path.includes('/admin/generate-test')) {
      return {
        title: 'Sinh đề Tự động',
        breadcrumb: 'Sinh đề tự động',
      };
    }
    if (path.includes('/admin/users')) {
      return {
        title: 'Quản lý Người dùng',
        breadcrumb: 'Người dùng',
      };
    }
    return {
      title: 'Bảng Điều khiển Quản trị viên',
      breadcrumb: 'Tổng quan',
    };
  };

  const pageInfo = getPageInfo();
  const initialLetter = (user?.username || 'A')[0].toUpperCase();

  return (
    <div className="admin-container">
      {/* Lớp nền mờ khi mở menu trên di động */}
      {isMobileMenuOpen && (
        <div className="admin-sidebar-backdrop" onClick={closeMobileMenu} />
      )}

      {/* Thanh điều hướng cố định bên trái (Sidebar) */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        {/* Logo thương hiệu */}
        <div className="sidebar-logo">
          <div className="logo-brand">
            <span className="logo-title">EduPlay</span>
            <span className="logo-badge">Admin</span>
          </div>
          <button 
            type="button" 
            className="sidebar-close-btn" 
            onClick={closeMobileMenu}
            aria-label="Đóng menu"
          >
            ✕
          </button>
        </div>

        {/* Danh sách điều hướng */}
        <nav className="sidebar-nav">
          <div className="nav-group-label">NỘI DUNG & ĐÀO TẠO</div>
          <ul className="nav-list">
            <li>
              <NavLink
                to="/admin/courses"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-bullet"></span>
                <span className="nav-text">Quản lý Khóa học</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/questions"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-bullet"></span>
                <span className="nav-text">Ngân hàng Câu hỏi</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/generate-test"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-bullet"></span>
                <span className="nav-text">Sinh đề Tự động</span>
              </NavLink>
            </li>
          </ul>

          <div className="nav-group-label">HỆ THỐNG</div>
          <ul className="nav-list">
            <li>
              <NavLink
                to="/admin/users"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-bullet"></span>
                <span className="nav-text">Quản lý Người dùng</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Thông tin hồ sơ admin ở đáy sidebar */}
        <div className="sidebar-footer">
          <div className="user-profile-mini">
            <div className="profile-avatar-circle">{initialLetter}</div>
            <div className="profile-info-mini">
              <span className="profile-username" title={user?.username}>{user?.username}</span>
              <span className="profile-role-tag">Quản trị viên</span>
            </div>
          </div>
        </div>
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
            <div className="header-page-meta">
              <div className="header-breadcrumbs">
                <span className="crumb-root">Hệ thống</span>
                <span className="crumb-sep">/</span>
                <span className="crumb-active">{pageInfo.breadcrumb}</span>
              </div>
              <h1 className="header-page-title">{pageInfo.title}</h1>
            </div>
          </div>

          <div className="admin-header-actions">
            <Link to="/" className="btn-view-site" title="Quay về giao diện người dùng">
              Trang chủ
            </Link>

            <div className="header-divider"></div>

            <div className="admin-user-pill">
              <div className="user-pill-avatar">{initialLetter}</div>
              <div className="user-pill-text">
                <span className="user-pill-name">{user?.username}</span>
                <span className="user-pill-role">Admin</span>
              </div>
            </div>

            <button onClick={handleLogout} className="btn-logout" title="Đăng xuất khỏi hệ thống">
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
import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import './ParentLayout.css';

export default function ParentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/parent/dashboard', label: 'Tổng quan' },
    { path: '/parent/children', label: 'Hồ sơ của con' },
    { path: '/parent/report', label: 'Báo cáo năng lực' },
    { path: '/parent/assignments', label: 'Giao bài tập' },
  ];

  return (
    <div className="parent-layout-container">
      {/* 1. Header Bar */}
      <header className="parent-topbar">
        <div className="topbar-brand-area">
          <button
            type="button"
            className="btn-mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu điều hướng"
          >
            ☰
          </button>
          <Link to="/" className="parent-brand-logo">
            EduPlay
          </Link>
          <span className="portal-badge">Cổng Phụ Huynh</span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="parent-desktop-nav">
          {navLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `parent-nav-item ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Account & Actions */}
        <div className="topbar-user-area">
          <div className="user-info-text">
            <span className="user-role-label">Phụ huynh</span>
            <span className="user-username-val">{user?.username || 'Tài khoản'}</span>
          </div>

          <Link to="/" className="btn-topbar-link" title="Về trang chủ">
            Trang chủ
          </Link>

          <button
            type="button"
            className="btn-topbar-logout"
            onClick={handleLogout}
            title="Đăng xuất khỏi hệ thống"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* 2. Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <div className="mobile-drawer-header">
            <span className="drawer-title">Danh mục Phụ huynh</span>
            <button
              type="button"
              className="btn-close-drawer"
              onClick={() => setMobileMenuOpen(false)}
            >
              ✕
            </button>
          </div>
          <nav className="mobile-drawer-links">
            {navLinks.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mobile-drawer-actions">
              <Link to="/" className="mobile-action-link" onClick={() => setMobileMenuOpen(false)}>
                Về Trang chủ
              </Link>
              <button type="button" className="mobile-action-logout" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* 3. Main Outlet Container */}
      <main className="parent-main-content">
        <div className="parent-content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

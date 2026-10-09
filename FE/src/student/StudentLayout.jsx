import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import axiosClient from '../api/axiosClient';
import './StudentLayout.css';

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [studentInfo, setStudentInfo] = useState({
    nickname: user?.username || 'Bạn nhỏ',
    totalPoints: 0,
    timeLimitMinutes: 60,
    earnedBadges: []
  });

  const [remainingSeconds, setRemainingSeconds] = useState(60 * 60);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lấy và cập nhật thông tin học sinh (điểm số, huy hiệu)
  const fetchStudentInfo = useCallback(async () => {
    try {
      const res = await axiosClient.get('/student/dashboard');
      if (res.data?.isSuccess && res.data.data) {
        const data = res.data.data;
        setStudentInfo(prev => ({
          ...prev,
          nickname: data.nickname || user?.username || 'Bạn nhỏ',
          totalPoints: data.totalPoints || 0,
          timeLimitMinutes: data.timeLimitMinutes || 60,
          earnedBadges: data.earnedBadges || []
        }));
      }
    } catch (err) {
      console.warn('Không thể tải thông tin học sinh:', err);
    }
  }, [user?.username]);

  // Khởi tạo thông tin và cài đặt đồng hồ đếm ngược một lần duy nhất khi đăng nhập
  useEffect(() => {
    const initData = async () => {
      try {
        const res = await axiosClient.get('/student/dashboard');
        if (res.data?.isSuccess && res.data.data) {
          const data = res.data.data;
          setStudentInfo({
            nickname: data.nickname || user?.username || 'Bạn nhỏ',
            totalPoints: data.totalPoints || 0,
            timeLimitMinutes: data.timeLimitMinutes || 60,
            earnedBadges: data.earnedBadges || []
          });

          const totalSecs = (data.timeLimitMinutes || 60) * 60;
          setRemainingSeconds(totalSecs);
        }
      } catch (err) {
        console.warn('Không thể tải thông tin ban đầu học sinh:', err);
      }
    };

    initData();
  }, [user?.username]);

  // Bộ đếm ngược thời gian học mỗi ngày (Screen time)
  useEffect(() => {
    if (remainingSeconds <= 0) {
      setIsTimeUp(true);
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Ghi nhớ context để không tạo object mới mỗi lần re-render
  const outletContext = useMemo(() => ({
    studentInfo,
    refreshStudentInfo: fetchStudentInfo
  }), [studentInfo, fetchStudentInfo]);

  return (
    <div className="student-app-container">
      {/* Thanh Header chính */}
      <header className="student-header">
        <div className="student-header-inner">
          {/* Logo & Portal title */}
          <div className="student-brand-group">
            <Link to="/student" className="student-logo-link">
              <span className="student-logo-badge">EduPlay</span>
              <span className="student-portal-title">Góc Học Tập</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className={`student-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <NavLink
              to="/student/dashboard"
              className={({ isActive }) => `student-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Tổng quan
            </NavLink>
            <NavLink
              to="/student/roadmap"
              className={({ isActive }) => `student-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Lộ trình học
            </NavLink>
            <NavLink
              to="/student/assignments"
              className={({ isActive }) => `student-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Nhiệm vụ bố mẹ giao
            </NavLink>
            <NavLink
              to="/student/badges"
              className={({ isActive }) => `student-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Huy hiệu
            </NavLink>
          </nav>

          {/* Action Chips & Account */}
          <div className="student-status-group">
            {/* Điểm thưởng tích lũy */}
            <div className="student-chip point-chip" title="Điểm thưởng tích lũy của bạn">
              <span className="point-icon">★</span>
              <span className="point-value">{studentInfo.totalPoints}</span>
              <span className="point-label">điểm</span>
            </div>

            {/* Đồng hồ giới hạn giờ học của phụ huynh */}
            <div
              className={`student-chip timer-chip ${remainingSeconds < 300 ? 'timer-warning' : ''}`}
              title="Thời gian học còn lại theo giới hạn phụ huynh cài đặt"
            >
              <span className="timer-icon">⏱</span>
              <span className="timer-text">{formatTimer(remainingSeconds)}</span>
            </div>

            {/* Thông tin học sinh & Thao tác */}
            <div className="student-user-pill">
              <span className="student-nickname" title={studentInfo.nickname}>
                {studentInfo.nickname}
              </span>
            </div>

            <Link to="/" className="student-btn-ghost" title="Về trang chủ">
              Trang chủ
            </Link>

            <button onClick={handleLogout} className="student-btn-logout">
              Đăng xuất
            </button>

            {/* Nút menu trên mobile */}
            <button
              className="student-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* Cảnh báo hết giờ học do phụ huynh cài đặt */}
      {isTimeUp && (
        <div className="student-timeup-banner">
          <div className="timeup-content">
            <span className="timeup-icon">⌛</span>
            <span className="timeup-text">
              Đã hết giờ học hôm nay theo cài đặt của bố mẹ ({studentInfo.timeLimitMinutes} phút). Hãy nghỉ ngơi đôi mắt và vận động một chút nhé!
            </span>
          </div>
        </div>
      )}

      {/* Nội dung trang con */}
      <main className="student-main-content">
        <Outlet context={outletContext} />
      </main>
    </div>
  );
}

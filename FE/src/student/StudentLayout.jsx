import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import axiosClient from '../api/axiosClient';
import './StudentLayout.css';

export default function StudentLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [studentInfo, setStudentInfo] = useState({
    nickname: user?.username || 'Bạn nhỏ',
    totalPoints: 0,
    timeLimitMinutes: 60,
    earnedBadges: []
  });

  const todayKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const storageKey = useMemo(() => {
    const uid = user?.userId || user?.username || 'student';
    return `eduplay_screen_time_${uid}_${todayKey}`;
  }, [user?.userId, user?.username, todayKey]);

  // Đọc giá trị lưu trữ ban đầu từ localStorage nếu có
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    const uid = user?.userId || user?.username || 'student';
    const d = new Date();
    const tKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const saved = localStorage.getItem(`eduplay_screen_time_${uid}_${tKey}`);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      return isNaN(parsed) ? 60 * 60 : Math.max(0, parsed);
    }
    return 60 * 60;
  });

  const [isTimeUp, setIsTimeUp] = useState(() => {
    const uid = user?.userId || user?.username || 'student';
    const d = new Date();
    const tKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const saved = localStorage.getItem(`eduplay_screen_time_${uid}_${tKey}`);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      return parsed <= 0;
    }
    return false;
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lấy và cập nhật thông tin học sinh (điểm số, huy hiệu)
  const fetchStudentInfo = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'Student') return;
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
  }, [isAuthenticated, user?.role, user?.username]);

  // Khởi tạo thông tin và cài đặt đồng hồ đếm ngược khi đăng nhập (nếu chưa có trong localStorage)
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Student') return;
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

          // Nếu chưa có thời gian lưu cho ngày hôm nay, khởi tạo từ timeLimitMinutes
          const saved = localStorage.getItem(storageKey);
          if (saved === null) {
            const totalSecs = (data.timeLimitMinutes || 60) * 60;
            setRemainingSeconds(totalSecs);
            setIsTimeUp(totalSecs <= 0);
            localStorage.setItem(storageKey, totalSecs.toString());
          }
        }
      } catch (err) {
        console.warn('Không thể tải thông tin ban đầu học sinh:', err);
      }
    };

    initData();
  }, [isAuthenticated, user?.role, user?.username, storageKey]);

  // Bộ đếm ngược thời gian học mỗi ngày (Screen time) - lưu vào localStorage theo ngày
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Student') return;
    if (remainingSeconds <= 0) {
      setIsTimeUp(true);
      if (storageKey) {
        localStorage.setItem(storageKey, '0');
      }
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        const nextVal = prev - 1;
        if (nextVal <= 0) {
          clearInterval(timer);
          setIsTimeUp(true);
          if (storageKey) {
            localStorage.setItem(storageKey, '0');
          }
          return 0;
        }
        if (storageKey && nextVal % 5 === 0) {
          localStorage.setItem(storageKey, nextVal.toString());
        }
        return nextVal;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, user?.role, remainingSeconds <= 0, storageKey]);

  // Lưu chính xác số giây còn lại khi đóng hoặc reload trang
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (storageKey && remainingSeconds >= 0) {
        localStorage.setItem(storageKey, remainingSeconds.toString());
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [storageKey, remainingSeconds]);

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
    refreshStudentInfo: fetchStudentInfo,
    isTimeUp,
    remainingSeconds
  }), [studentInfo, fetchStudentInfo, isTimeUp, remainingSeconds]);

  // Bảo vệ route: Chỉ cho phép người dùng có quyền Student truy cập
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'Student') {
    if (user?.role === 'Parent') return <Navigate to="/parent" replace />;
    if (user?.role === 'Admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

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

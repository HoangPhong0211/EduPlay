import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import './LandingPage.css';
import axiosClient from '../api/axiosClient';

export default function LandingPage() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null); // null = tất cả
  const [searchQuery, setSearchQuery] = useState('');

  const { user, isAuthenticated, logout } = useAuth();

  // Tải dữ liệu khóa học thực tế từ Backend (Database)
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const gradesToFetch = selectedGrade ? [selectedGrade] : [1, 2, 3];
        const responses = await Promise.allSettled(
          gradesToFetch.map((grade) => axiosClient.get(`/student/roadmap/${grade}`))
        );

        const loadedCourses = [];
        responses.forEach((res, idx) => {
          if (res.status === 'fulfilled' && res.value.data?.isSuccess && Array.isArray(res.value.data?.data)) {
            const currentGrade = gradesToFetch[idx];
            res.value.data.data.forEach((topic) => {
              loadedCourses.push({
                id: topic.topicId,
                grade: currentGrade,
                title: topic.topicName,
                desc: topic.description || 'Khám phá các bài học toán thú vị.',
              });
            });
          }
        });

        setCourses(loadedCourses);
      } catch (error) {
        console.error('Lỗi khi tải danh sách khóa học từ máy chủ:', error);
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [selectedGrade]);

  const handleSelectGrade = (grade) => {
    setSelectedGrade(selectedGrade === grade ? null : grade);
    setIsMenuOpen(false); // Tự động đóng menu sau khi chọn
  };

  // Lọc khóa học theo lớp và từ khóa tìm kiếm
  const filteredCourses = courses.filter((course) => {
    const matchGrade = selectedGrade === null || course.grade === selectedGrade;
    const matchSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGrade && matchSearch;
  });

  const getRoleDisplayName = (role) => {
    if (role === 'Parent') return 'Phụ huynh';
    if (role === 'Student') return 'Học sinh';
    if (role === 'Admin') return 'Quản trị viên';
    return role;
  };

  return (
    <div className="landing-container">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <button
            className="menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="Danh mục khối lớp"
            aria-label="Danh mục khối lớp"
          >
            ☰
          </button>
          <Link to="/" className="logo">EduPlay</Link>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Tìm kiếm chương trình học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button aria-label="Tìm kiếm">🔍</button>
        </div>

        <div className="auth-buttons">
          {isAuthenticated && user ? (
            <div className="user-profile">
              <span className="user-greeting">
                Xin chào, <strong>{user.username}</strong>
              </span>
              <span className="user-role-badge">
                {getRoleDisplayName(user.role)}
              </span>

              {user.role === 'Parent' && (
                <Link
                  to="/parent/create-student"
                  className="btn-create-child"
                  style={{
                    marginLeft: '10px',
                    padding: '6px 12px',
                    background: '#4dd0e1',
                    borderRadius: '8px',
                    color: '#004d40',
                    fontWeight: '600',
                    textDecoration: 'none',
                    fontSize: '13px'
                  }}
                >
                  + Tạo hồ sơ cho con
                </Link>
              )}

              {user.role === 'Admin' && (
                <Link
                  to="/admin/courses"
                  className="btn-admin-manage"
                  style={{
                    marginLeft: '10px',
                    padding: '6px 12px',
                    background: '#ffb74d',
                    borderRadius: '8px',
                    color: '#e65100',
                    fontWeight: '600',
                    textDecoration: 'none',
                    fontSize: '13px'
                  }}
                >
                  ⚙ Trang Quản trị
                </Link>
              )}

              <button onClick={logout} className="btn-logout">
                Đăng xuất
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-login">Đăng nhập</Link>
              <Link to="/register" className="btn-register">Đăng ký</Link>
            </>
          )}
        </div>
      </header>

      {/* Menu Sidebar (Khối lớp) */}
      {isMenuOpen && (
        <>
          <div className="sidebar-backdrop" onClick={() => setIsMenuOpen(false)} />
          <aside className="sidebar">
            <div className="sidebar-header">
              <h3>CHỌN KHỐI LỚP</h3>
              <button className="sidebar-close" onClick={() => setIsMenuOpen(false)}>✕</button>
            </div>
            <ul>
              <li
                className={selectedGrade === null ? 'active' : ''}
                onClick={() => handleSelectGrade(null)}
              >
                Tất cả các lớp
              </li>
              <li
                className={selectedGrade === 1 ? 'active' : ''}
                onClick={() => handleSelectGrade(1)}
              >
                LỚP 1
              </li>
              <li
                className={selectedGrade === 2 ? 'active' : ''}
                onClick={() => handleSelectGrade(2)}
              >
                LỚP 2
              </li>
              <li
                className={selectedGrade === 3 ? 'active' : ''}
                onClick={() => handleSelectGrade(3)}
              >
                LỚP 3
              </li>
            </ul>
          </aside>
        </>
      )}

      {/* Thanh Menu ngang */}
      <nav className="main-nav">
        <ul>
          <li>Giới thiệu</li>
          <li>Lộ trình học</li>
          <li>Luyện tập</li>
          <li>Báo cáo năng lực</li>
          <li>Huy hiệu</li>
          <li>Hướng dẫn</li>
        </ul>
      </nav>

      {/* Slogan & Bộ lọc */}
      <div className="slogan-banner">
        <h2>HỌC TOÁN VUI NHỘN CÙNG EDUPLAY</h2>
        <p>Nền tảng học tập thông minh, cá nhân hóa cho học sinh tiểu học</p>
        {selectedGrade && (
          <div className="filter-tag">
            Đang lọc: <strong>Lớp {selectedGrade}</strong>
            <button onClick={() => setSelectedGrade(null)}>✕ Xóa lọc</button>
          </div>
        )}
      </div>

      {/* Lưới khóa học */}
      <div className="course-section">
        <h3 className="section-title">
          {selectedGrade ? `CHƯƠNG TRÌNH HỌC LỚP ${selectedGrade}` : 'TẤT CẢ CHƯƠNG TRÌNH HỌC'}
        </h3>

        {isLoading ? (
          <div className="no-courses">Đang tải dữ liệu khóa học từ hệ thống...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="no-courses">
            {searchQuery
              ? `Không tìm thấy chương trình học phù hợp với từ khóa "${searchQuery}".`
              : 'Hiện tại chưa có khóa học nào được tạo cho khối lớp này.'}
          </div>
        ) : (
          <div className="course-grid">
            {filteredCourses.map((course) => (
              <div key={course.id} className="course-card">
                <span className="course-grade-badge">Lớp {course.grade}</span>
                <h4>{course.title}</h4>
                <p>{course.desc}</p>
                <button className="btn-start-learn">Bắt đầu học</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
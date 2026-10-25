import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import './LandingPage.css';
import axiosClient from '../api/axiosClient';

export default function LandingPage() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null); // null = tất cả
  const [searchQuery, setSearchQuery] = useState('');

  const { user, isAuthenticated, logout } = useAuth();

  // Tải dữ liệu khóa học thực tế từ Backend (Database)
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const gradesToFetch = selectedGrade ? [selectedGrade] : [1, 2, 3, 4, 5];
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

  const handleScrollToAbout = (e) => {
    e.preventDefault();
    const elem = document.getElementById('about-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
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
                  to="/parent"
                  className="btn-create-child"
                  style={{
                    marginLeft: '10px',
                    padding: '6px 14px',
                    background: '#2563eb',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontWeight: '600',
                    textDecoration: 'none',
                    fontSize: '13px'
                  }}
                >
                  Cổng Phụ Huynh
                </Link>
              )}

              {user.role === 'Student' && (
                <Link
                  to="/student"
                  className="btn-create-child"
                  style={{
                    marginLeft: '10px',
                    padding: '6px 14px',
                    background: '#10b981',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontWeight: '700',
                    textDecoration: 'none',
                    fontSize: '13px'
                  }}
                >
                  Góc Học Tập
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

      {/* Menu Sidebar (Khối lớp & Lối tắt theo vai trò) */}
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
              <li
                className={selectedGrade === 4 ? 'active' : ''}
                onClick={() => handleSelectGrade(4)}
              >
                LỚP 4
              </li>
              <li
                className={selectedGrade === 5 ? 'active' : ''}
                onClick={() => handleSelectGrade(5)}
              >
                LỚP 5
              </li>
            </ul>

            {/* Lối tắt truy cập nhanh phân quyền chặt chẽ theo vai trò */}
            <div style={{ padding: '16px 0 8px', borderTop: '1px solid #e2e8f0', marginTop: '14px' }}>
              <h4 style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Lối tắt truy cập
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Lối tắt cho Student */}
                {isAuthenticated && user?.role === 'Student' && (
                  <>
                    <li>
                      <Link
                        to="/student/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        style={{ textDecoration: 'none', color: '#00838f', fontWeight: '600', display: 'block', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}
                      >
                        🏠 Góc Học Tập
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/student/roadmap"
                        onClick={() => setIsMenuOpen(false)}
                        style={{ textDecoration: 'none', color: '#00838f', fontWeight: '600', display: 'block', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}
                      >
                        🗺️ Lộ trình học
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/student/badges"
                        onClick={() => setIsMenuOpen(false)}
                        style={{ textDecoration: 'none', color: '#00838f', fontWeight: '600', display: 'block', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}
                      >
                        🏆 Kho Huy hiệu
                      </Link>
                    </li>
                  </>
                )}

                {/* Lối tắt cho Parent */}
                {isAuthenticated && user?.role === 'Parent' && (
                  <>
                    <li>
                      <Link
                        to="/parent/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        style={{ textDecoration: 'none', color: '#2563eb', fontWeight: '600', display: 'block', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}
                      >
                        🏠 Cổng Phụ Huynh
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/parent/children"
                        onClick={() => setIsMenuOpen(false)}
                        style={{ textDecoration: 'none', color: '#2563eb', fontWeight: '600', display: 'block', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}
                      >
                        👨‍👩‍👧 Quản lý con
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/parent/assignments"
                        onClick={() => setIsMenuOpen(false)}
                        style={{ textDecoration: 'none', color: '#2563eb', fontWeight: '600', display: 'block', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}
                      >
                        📝 Giao bài tập
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/parent/report"
                        onClick={() => setIsMenuOpen(false)}
                        style={{ textDecoration: 'none', color: '#2563eb', fontWeight: '600', display: 'block', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}
                      >
                        📊 Báo cáo năng lực
                      </Link>
                    </li>
                  </>
                )}

                {/* Lối tắt cho Admin */}
                {isAuthenticated && user?.role === 'Admin' && (
                  <>
                    <li>
                      <Link
                        to="/admin/courses"
                        onClick={() => setIsMenuOpen(false)}
                        style={{ textDecoration: 'none', color: '#d97706', fontWeight: '600', display: 'block', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}
                      >
                        ⚙ Quản lý Khóa học
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/admin/questions"
                        onClick={() => setIsMenuOpen(false)}
                        style={{ textDecoration: 'none', color: '#d97706', fontWeight: '600', display: 'block', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}
                      >
                        ❓ Ngân hàng Câu hỏi
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/admin/users"
                        onClick={() => setIsMenuOpen(false)}
                        style={{ textDecoration: 'none', color: '#d97706', fontWeight: '600', display: 'block', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}
                      >
                        👥 Quản lý Người dùng
                      </Link>
                    </li>
                  </>
                )}

                {/* Lối tắt cho Guest */}
                {!isAuthenticated && (
                  <>
                    <li>
                      <Link
                        to="/login"
                        onClick={() => setIsMenuOpen(false)}
                        style={{ textDecoration: 'none', color: '#00838f', fontWeight: '600', display: 'block', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}
                      >
                        🔑 Đăng nhập
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/register"
                        onClick={() => setIsMenuOpen(false)}
                        style={{ textDecoration: 'none', color: '#00838f', fontWeight: '600', display: 'block', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}
                      >
                        ✨ Đăng ký tài khoản
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </aside>
        </>
      )}

      {/* Thanh Menu ngang kết nối trực tiếp các phân hệ theo Role */}
      <nav className="main-nav">
        <ul>
          {/* 1. Khi chưa đăng nhập (Guest): Chỉ hiển thị "Giới thiệu" và "Hướng dẫn" */}
          {!isAuthenticated && (
            <>
              <li>
                <a href="#about" onClick={handleScrollToAbout}>Giới thiệu</a>
              </li>
              <li>
                <a href="#guide" onClick={(e) => { e.preventDefault(); setIsGuideOpen(true); }}>Hướng dẫn</a>
              </li>
            </>
          )}

          {/* 2. Khi đăng nhập là Student: "Giới thiệu", "Lộ trình học", "Luyện tập", "Nhiệm vụ học tập", "Huy hiệu", "Hướng dẫn" */}
          {isAuthenticated && user?.role === 'Student' && (
            <>
              <li>
                <a href="#about" onClick={handleScrollToAbout}>Giới thiệu</a>
              </li>
              <li>
                <Link to="/student/roadmap">Lộ trình học</Link>
              </li>
              <li>
                <Link to="/student/roadmap">Luyện tập</Link>
              </li>
              <li>
                <Link to="/student/assignments">Nhiệm vụ học tập</Link>
              </li>
              <li>
                <Link to="/student/badges">Huy hiệu</Link>
              </li>
              <li>
                <a href="#guide" onClick={(e) => { e.preventDefault(); setIsGuideOpen(true); }}>Hướng dẫn</a>
              </li>
            </>
          )}

          {/* 3. Khi đăng nhập là Parent: "Giới thiệu", "Quản lý con", "Giao nhiệm vụ", "Báo cáo năng lực", "Hướng dẫn" */}
          {isAuthenticated && user?.role === 'Parent' && (
            <>
              <li>
                <a href="#about" onClick={handleScrollToAbout}>Giới thiệu</a>
              </li>
              <li>
                <Link to="/parent/children">Quản lý con</Link>
              </li>
              <li>
                <Link to="/parent/assignments">Giao nhiệm vụ</Link>
              </li>
              <li>
                <Link to="/parent/report">Báo cáo năng lực</Link>
              </li>
              <li>
                <a href="#guide" onClick={(e) => { e.preventDefault(); setIsGuideOpen(true); }}>Hướng dẫn</a>
              </li>
            </>
          )}

          {/* 4. Khi đăng nhập là Admin: "Giới thiệu", "Trang Quản trị", "Hướng dẫn" */}
          {isAuthenticated && user?.role === 'Admin' && (
            <>
              <li>
                <a href="#about" onClick={handleScrollToAbout}>Giới thiệu</a>
              </li>
              <li>
                <Link to="/admin/courses">Trang Quản trị</Link>
              </li>
              <li>
                <a href="#guide" onClick={(e) => { e.preventDefault(); setIsGuideOpen(true); }}>Hướng dẫn</a>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Slogan & Bộ lọc */}
      <div className="slogan-banner" id="about-section">
        <h2>HỌC TOÁN VUI NHỘN CÙNG EDUPLAY</h2>
        <p>Nền tảng học tập thông minh, cá nhân hóa cho học sinh Tiểu học Lớp 1 - 5</p>
        
        {/* Nút hành động chính trong Banner theo vai trò */}
        <div style={{ marginTop: '14px' }}>
          {!isAuthenticated && (
            <Link to="/login" className="btn-hero-explore">
              Đăng nhập để học ngay →
            </Link>
          )}
          {isAuthenticated && user?.role === 'Student' && (
            <Link to="/student/roadmap" className="btn-hero-explore">
              Khám phá Lộ trình học ngay →
            </Link>
          )}
          {isAuthenticated && user?.role === 'Parent' && (
            <Link to="/parent/dashboard" className="btn-hero-explore" style={{ background: '#1d4ed8' }}>
              Vào Cổng Phụ Huynh →
            </Link>
          )}
          {isAuthenticated && user?.role === 'Admin' && (
            <Link to="/admin/courses" className="btn-hero-explore" style={{ background: '#ea580c' }}>
              Vào Trang Quản Trị →
            </Link>
          )}
        </div>

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
                
                {/* 1. Nếu chưa đăng nhập: Bấm vào chuyển hướng sang /login */}
                {!isAuthenticated && (
                  <Link
                    to="/login"
                    className="btn-start-learn"
                  >
                    Bắt đầu học →
                  </Link>
                )}

                {/* 2. Nếu là Student: Cho phép bấm vào học bình thường */}
                {isAuthenticated && user?.role === 'Student' && (
                  <Link
                    to={`/student/roadmap?grade=${course.grade}`}
                    className="btn-start-learn"
                  >
                    Bắt đầu học →
                  </Link>
                )}

                {/* 3. Nếu là Parent: Điều hướng về trang Giao bài tập tương ứng */}
                {isAuthenticated && user?.role === 'Parent' && (
                  <Link
                    to="/parent/assignments"
                    className="btn-start-learn"
                    style={{ background: '#2563eb' }}
                  >
                    Giao nhiệm vụ →
                  </Link>
                )}

                {/* 4. Nếu là Admin: Điều hướng về trang Quản lý khóa học tương ứng */}
                {isAuthenticated && user?.role === 'Admin' && (
                  <Link
                    to="/admin/courses"
                    className="btn-start-learn"
                    style={{ background: '#f59e0b', color: '#ffffff' }}
                  >
                    Quản lý khóa học →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Hướng dẫn sử dụng EduPlay */}
      {isGuideOpen && (
        <div className="guide-modal-backdrop" onClick={() => setIsGuideOpen(false)}>
          <div className="guide-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="guide-modal-header">
              <h3>📖 HƯỚNG DẪN SỬ DỤNG EDUPLAY</h3>
              <button
                className="guide-modal-close"
                onClick={() => setIsGuideOpen(false)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>
            <div className="guide-modal-body">
              {/* Dành cho Học sinh */}
              {(!isAuthenticated || user?.role === 'Student') && (
                <div className="guide-card-item">
                  <h4 style={{ color: '#00838f' }}>🎒 Dành cho Học sinh (Student):</h4>
                  <ol>
                    <li>Chọn khối lớp (Lớp 1 đến Lớp 5) tại danh mục để xem các bài học toán.</li>
                    <li>Vào mục <strong>"Lộ trình học"</strong> để khám phá và học tập theo từng chủ đề.</li>
                    <li>Làm các bài <strong>"Luyện tập"</strong> và hoàn thành <strong>"Nhiệm vụ học tập"</strong> bố mẹ giao.</li>
                    <li>Tích lũy điểm thưởng để mở khóa các <strong>"Huy hiệu"</strong> vinh danh thú vị!</li>
                  </ol>
                </div>
              )}

              {/* Dành cho Phụ huynh */}
              {(!isAuthenticated || user?.role === 'Parent') && (
                <div className="guide-card-item">
                  <h4 style={{ color: '#2563eb' }}>👨‍👩‍👧 Dành cho Phụ huynh (Parent):</h4>
                  <ol>
                    <li>Vào mục <strong>"Quản lý con"</strong> để tạo tài khoản hoặc quản lý danh sách các con.</li>
                    <li>Sử dụng tính năng <strong>"Giao nhiệm vụ"</strong> để giao bài tập ôn luyện theo chủ đề.</li>
                    <li>Theo dõi <strong>"Báo cáo năng lực"</strong> để xem phân tích điểm mạnh, điểm yếu và lời khuyên từ hệ thống.</li>
                  </ol>
                </div>
              )}

              {/* Dành cho Quản trị viên */}
              {(!isAuthenticated || user?.role === 'Admin') && (
                <div className="guide-card-item">
                  <h4 style={{ color: '#d97706' }}>⚙ Dành cho Quản trị viên (Admin):</h4>
                  <ol>
                    <li>Truy cập <strong>"Trang Quản trị"</strong> để quản lý toàn bộ Khóa học, Chủ đề và Bài học.</li>
                    <li>Sử dụng <strong>"Ngân hàng câu hỏi"</strong> và tính năng <strong>"Sinh đề Tự động"</strong> bằng AI.</li>
                    <li>Quản lý thông tin, vai trò của người dùng trên toàn hệ thống.</li>
                  </ol>
                </div>
              )}

              {/* Dành cho Khách chưa đăng nhập */}
              {!isAuthenticated && (
                <div className="guide-card-item" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                  <h4 style={{ color: '#16a34a' }}>✨ Bạn chưa có tài khoản?</h4>
                  <p style={{ margin: 0 }}>
                    Hãy bấm nút <strong>"Đăng ký"</strong> ở góc trên bên phải để tạo tài khoản Phụ huynh, hoặc liên hệ phụ huynh để được cấp tài khoản Học sinh bắt đầu trải nghiệm!
                  </p>
                </div>
              )}
            </div>
            <div className="guide-modal-footer">
              <button
                type="button"
                className="btn-guide-close"
                onClick={() => setIsGuideOpen(false)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
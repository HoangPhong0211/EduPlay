import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import './StudentDashboard.css';

export default function StudentDashboard() {
  const { studentInfo } = useOutletContext();
  const [assignments, setAssignments] = useState([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  // Tải danh sách bài tập được giao từ phụ huynh (chạy 1 lần duy nhất khi vào trang)
  useEffect(() => {
    let isMounted = true;
    const fetchAssignments = async () => {
      setIsLoadingAssignments(true);
      try {
        const res = await axiosClient.get('/student/assignments');
        if (isMounted && res.data?.isSuccess && Array.isArray(res.data.data)) {
          setAssignments(res.data.data);
        }
      } catch (err) {
        console.warn('Không thể tải bài tập phụ huynh giao:', err);
      } finally {
        if (isMounted) {
          setIsLoadingAssignments(false);
        }
      }
    };

    fetchAssignments();
    return () => {
      isMounted = false;
    };
  }, []);

  const pendingAssignments = assignments.filter(a => a.status !== 'Completed');

  // Tính cấp bậc dựa trên điểm số
  const calculateLevel = (points) => {
    if (points >= 200) return { title: 'Bậc thầy Toán học', nextTarget: 300, levelNum: 4 };
    if (points >= 100) return { title: 'Thám tử Thông minh', nextTarget: 200, levelNum: 3 };
    if (points >= 50) return { title: 'Chiến binh Chăm chỉ', nextTarget: 100, levelNum: 2 };
    return { title: 'Tập sự Khám phá', nextTarget: 50, levelNum: 1 };
  };

  const currentLevel = calculateLevel(studentInfo?.totalPoints || 0);
  const progressPercent = Math.min(
    100,
    Math.round(((studentInfo?.totalPoints || 0) / currentLevel.nextTarget) * 100)
  );

  return (
    <div className="student-dashboard-page">
      {/* Banner Chào Mừng */}
      <section className="student-welcome-banner">
        <div className="welcome-text-wrap">
          <span className="welcome-tag">GÓC HỌC TẬP EDUPAY</span>
          <h1 className="welcome-greeting">
            Xin chào, <span className="nickname-highlight">{studentInfo?.nickname || 'Bạn nhỏ'}</span>!
          </h1>
          <p className="welcome-desc">
            Hôm nay bạn muốn cùng EduPlay khám phá những bài toán kỳ thú nào? Hãy tích lũy thêm điểm thưởng để mở khóa huy hiệu mới nhé!
          </p>
        </div>
        <div className="welcome-action-wrap">
          <Link to="/student/roadmap" className="btn-hero-primary">
            Khám phá Lộ trình học
          </Link>
        </div>
      </section>

      {/* Thẻ Thống Kê & Cấp Độ Học Sinh */}
      <section className="student-stats-row">
        {/* Thẻ Điểm Thưởng & Cấp Độ */}
        <div className="student-stat-card level-card">
          <div className="stat-card-header">
            <span className="stat-label">Cấp độ hiện tại</span>
            <span className="level-badge">Cấp {currentLevel.levelNum}</span>
          </div>
          <h2 className="level-name">{currentLevel.title}</h2>
          <div className="progress-container">
            <div className="progress-labels">
              <span>{studentInfo?.totalPoints || 0} điểm</span>
              <span>Mục tiêu: {currentLevel.nextTarget} điểm</span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
          <p className="stat-hint">
            Cần thêm {Math.max(0, currentLevel.nextTarget - (studentInfo?.totalPoints || 0))} điểm nữa để thăng cấp!
          </p>
        </div>

        {/* Thẻ Huy Hiệu Đã Đạt */}
        <div className="student-stat-card badge-card">
          <div className="stat-card-header">
            <span className="stat-label">Huy hiệu đạt được</span>
            <Link to="/student/badges" className="stat-link-more">
              Xem tất cả
            </Link>
          </div>
          <div className="stat-number-wrap">
            <span className="stat-huge-number">{studentInfo?.earnedBadges?.length || 0}</span>
            <span className="stat-unit">huy hiệu</span>
          </div>
          <div className="dashboard-badges-list">
            {(studentInfo?.earnedBadges || []).length > 0 ? (
              studentInfo.earnedBadges.map((badgeName, index) => (
                <span key={index} className="badge-pill">
                  ★ {badgeName}
                </span>
              ))
            ) : (
              <span className="empty-badge-text">
                Chưa có huy hiệu nào. Hãy làm bài tập để nhận huy hiệu "Chăm chỉ" (50 điểm)!
              </span>
            )}
          </div>
        </div>

        {/* Thẻ Giờ Học Phụ Huynh Đặt */}
        <div className="student-stat-card time-card">
          <div className="stat-card-header">
            <span className="stat-label">Thời gian học hôm nay</span>
            <span className="parent-tag">Bố mẹ cài đặt</span>
          </div>
          <div className="stat-number-wrap">
            <span className="stat-huge-number">{studentInfo?.timeLimitMinutes || 60}</span>
            <span className="stat-unit">phút/ngày</span>
          </div>
          <p className="time-note">
            Đồng hồ học tập đang đếm ngược trên thanh góc phải màn hình giúp bạn cân đối thời gian bảo vệ mắt.
          </p>
        </div>
      </section>

      {/* Chọn Nhanh Khối Lớp Luyện Tập */}
      <section className="student-quick-grades-section">
        <div className="section-title-wrap">
          <h2 className="section-heading">Lựa chọn Khối lớp học tập</h2>
          <p className="section-sub">Chọn khối lớp bạn đang học để bắt đầu các chủ đề toán học tương ứng</p>
        </div>
        <div className="grade-cards-grid">
          {[
            { grade: 1, title: 'Toán Khối Lớp 1' },
            { grade: 2, title: 'Toán Khối Lớp 2' },
            { grade: 3, title: 'Toán Khối Lớp 3' },
          ].map((item) => (
            <Link
              key={item.grade}
              to={`/student/roadmap?grade=${item.grade}`}
              className="grade-action-card"
            >
              <div className="grade-badge">Khối {item.grade}</div>
              <h3 className="grade-title">{item.title}</h3>
              {item.desc && <p className="grade-desc">{item.desc}</p>}
              <span className="grade-btn-text">Vào lộ trình Lớp {item.grade} →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Nhiệm Vụ Phụ Huynh Đã Giao */}
      <section className="student-assignments-section">
        <div className="section-title-wrap">
          <div className="title-with-badge">
            <h2 className="section-heading">Nhiệm vụ bố mẹ giao cho bạn</h2>
            {pendingAssignments.length > 0 && (
              <span className="pending-counter">{pendingAssignments.length} bài chưa làm</span>
            )}
          </div>
          <Link to="/student/assignments" className="section-link">
            Xem toàn bộ nhiệm vụ →
          </Link>
        </div>

        {isLoadingAssignments ? (
          <div className="loading-state-box">Đang tải danh sách nhiệm vụ...</div>
        ) : pendingAssignments.length === 0 ? (
          <div className="empty-tasks-box">
            <span className="empty-icon">✓</span>
            <h3 className="empty-title">Tuyệt vời! Bạn không còn bài tập nào chưa làm!</h3>
            <p className="empty-desc">
              Bạn có thể tự do vào "Lộ trình học" để luyện tập thêm hoặc khám phá các chủ đề mới.
            </p>
            <Link to="/student/roadmap" className="btn-secondary-link">
              Đến lộ trình học
            </Link>
          </div>
        ) : (
          <div className="task-cards-list">
            {pendingAssignments.slice(0, 3).map((task) => (
              <div key={task.id} className="task-summary-card">
                <div className="task-main-info">
                  <span className="task-chip-assigned">Nhiệm vụ mới</span>
                  <h4 className="task-lesson-title">{task.lessonTitle}</h4>
                  <span className="task-due-date">
                    Hạn nộp: {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <Link
                  to={`/student/practice/${task.lessonId}?assignmentId=${task.id}`}
                  className="btn-start-task"
                >
                  Làm bài ngay
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

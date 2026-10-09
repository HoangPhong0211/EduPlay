import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import './StudentAssignments.css';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PENDING, COMPLETED
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Tải danh sách bài tập của học sinh
  const fetchAssignments = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await axiosClient.get('/student/assignments');
      if (res.data?.isSuccess && Array.isArray(res.data.data)) {
        setAssignments(res.data.data);
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.error('Lỗi khi tải bài tập:', err);
      setErrorMsg('Không thể kết nối đến máy chủ để tải bài tập phụ huynh giao.');
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Lọc theo trạng thái
  const filteredAssignments = assignments.filter((item) => {
    if (filterStatus === 'PENDING') return item.status !== 'Completed';
    if (filterStatus === 'COMPLETED') return item.status === 'Completed';
    return true;
  });

  // Tính trạng thái hạn nộp
  const getDueStatus = (dueDateStr) => {
    if (!dueDateStr) return { text: 'Không thời hạn', isOverdue: false, isUrgent: false };
    const now = new Date();
    const due = new Date(dueDateStr);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Quá hạn ${Math.abs(diffDays)} ngày`, isOverdue: true, isUrgent: false };
    }
    if (diffDays === 0) {
      return { text: 'Hạn chót là hôm nay!', isOverdue: false, isUrgent: true };
    }
    if (diffDays <= 2) {
      return { text: `Còn ${diffDays} ngày nữa`, isOverdue: false, isUrgent: true };
    }
    return { text: `Hạn: ${due.toLocaleDateString('vi-VN')}`, isOverdue: false, isUrgent: false };
  };

  const pendingCount = assignments.filter(a => a.status !== 'Completed').length;
  const completedCount = assignments.filter(a => a.status === 'Completed').length;

  return (
    <div className="student-assignments-page">
      {/* Header Card */}
      <section className="assignments-header-card">
        <div className="assignments-header-info">
          <span className="assignments-badge">NHIỆM VỤ ĐƯỢC GIAO</span>
          <h1 className="assignments-title">Bài tập bố mẹ giao cho bạn</h1>
          <p className="assignments-desc">
            Hoàn thành các bài tập đúng hạn để nhận thêm điểm thưởng và sự khen ngợi từ bố mẹ nhé!
          </p>
        </div>

        {/* Thống kê nhanh */}
        <div className="assignments-header-stats">
          <div className="stats-box pending">
            <span className="stats-val">{pendingCount}</span>
            <span className="stats-lbl">Cần hoàn thành</span>
          </div>
          <div className="stats-box completed">
            <span className="stats-val">{completedCount}</span>
            <span className="stats-lbl">Đã hoàn thành</span>
          </div>
        </div>
      </section>

      {/* Thanh Bộ Lọc */}
      <div className="assignments-filter-bar">
        <div className="filter-buttons-group">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`filter-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
          >
            Tất cả ({assignments.length})
          </button>
          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`filter-btn ${filterStatus === 'PENDING' ? 'active' : ''}`}
          >
            Chưa làm ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('COMPLETED')}
            className={`filter-btn ${filterStatus === 'COMPLETED' ? 'active' : ''}`}
          >
            Đã hoàn thành ({completedCount})
          </button>
        </div>

        <button onClick={fetchAssignments} className="btn-refresh">
          Làm mới
        </button>
      </div>

      {/* Thông báo lỗi */}
      {errorMsg && (
        <div className="assignments-error-alert">{errorMsg}</div>
      )}

      {/* Danh sách Nhiệm vụ */}
      {isLoading ? (
        <div className="assignments-loading-box">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách bài tập...</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="assignments-empty-box">
          <h3>Không có bài tập nào ở mục này</h3>
          <p>
            {filterStatus === 'PENDING'
              ? 'Tuyệt vời! Bạn đã hoàn thành toàn bộ bài tập bố mẹ giao.'
              : 'Hiện chưa có bài tập nào được giao cho bạn.'}
          </p>
          <Link to="/student/roadmap" className="btn-go-roadmap">
            Tự do học trên Lộ trình →
          </Link>
        </div>
      ) : (
        <div className="assignments-grid">
          {filteredAssignments.map((task) => {
            const dueInfo = getDueStatus(task.dueDate);
            const isCompleted = task.status === 'Completed';

            return (
              <div
                key={task.id}
                className={`assignment-card ${isCompleted ? 'card-completed' : ''} ${dueInfo.isOverdue && !isCompleted ? 'card-overdue' : ''
                  }`}
              >
                <div className="assignment-card-header">
                  <span
                    className={`status-pill ${isCompleted ? 'status-done' : 'status-pending'
                      }`}
                  >
                    {isCompleted ? '✓ Đã hoàn thành' : 'Đang chờ làm'}
                  </span>
                  <span
                    className={`due-pill ${dueInfo.isOverdue
                        ? 'due-overdue'
                        : dueInfo.isUrgent
                          ? 'due-urgent'
                          : ''
                      }`}
                  >
                    {dueInfo.text}
                  </span>
                </div>

                <h3 className="assignment-lesson-title">{task.lessonTitle}</h3>

                <div className="assignment-card-footer">
                  <span className="assignment-id-meta">Nhiệm vụ #{task.id}</span>
                  <Link
                    to={`/student/practice/${task.lessonId}`}
                    className={`btn-action-task ${isCompleted ? 'btn-practice-again' : 'btn-do-now'
                      }`}
                  >
                    {isCompleted ? 'Luyện tập lại' : 'Làm bài ngay →'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import './ParentDashboard.css';

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal Giới hạn thời gian học
  const [timeModal, setTimeModal] = useState({
    isOpen: false,
    student: null,
    minutes: 60,
    isSubmitting: false,
  });

  // Modal Tạo tài khoản cho con
  const [createModal, setCreateModal] = useState({
    isOpen: false,
    username: '',
    password: '',
    nickname: '',
    isSubmitting: false,
    error: '',
  });

  // Toast thông báo
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [studentsRes, assignmentsRes] = await Promise.allSettled([
        axiosClient.get('/parent/students'),
        axiosClient.get('/parent/assignments'),
      ]);

      if (studentsRes.status === 'fulfilled' && Array.isArray(studentsRes.value.data)) {
        setStudents(studentsRes.value.data);
      } else {
        setStudents([]);
      }

      if (assignmentsRes.status === 'fulfilled' && Array.isArray(assignmentsRes.value.data)) {
        setAssignments(assignmentsRes.value.data);
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu tổng quan phụ huynh:', err);
      setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Xử lý Cài đặt Giới hạn thời gian học
  const handleOpenTimeModal = (student) => {
    setTimeModal({
      isOpen: true,
      student,
      minutes: student.timeLimitMinutes || 60,
      isSubmitting: false,
    });
  };

  const handleSaveTimeLimit = async (e) => {
    e.preventDefault();
    if (!timeModal.student) return;

    const mins = parseInt(timeModal.minutes, 10);
    if (isNaN(mins) || mins < 1 || mins > 240) {
      showToast('Thời gian học phải từ 1 đến 240 phút (tối đa 4 tiếng).', 'error');
      return;
    }

    setTimeModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      const response = await axiosClient.put('/parent/time-limit', {
        StudentId: timeModal.student.studentId,
        TimeLimitMinutes: mins,
      });

      if (response.data?.isSuccess) {
        showToast(response.data.message || 'Cập nhật giới hạn giờ học thành công!', 'success');
        setTimeModal({ isOpen: false, student: null, minutes: 60, isSubmitting: false });
        loadDashboardData();
      } else {
        showToast(response.data?.message || 'Không thể lưu giới hạn giờ học.', 'error');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.';
      showToast(message, 'error');
    } finally {
      setTimeModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Xử lý Tạo tài khoản học sinh cho con
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setCreateModal((prev) => ({ ...prev, error: '', isSubmitting: true }));

    const usernameTrimmed = createModal.username.trim();
    const nicknameTrimmed = createModal.nickname.trim();

    if (!usernameTrimmed || !createModal.password || !nicknameTrimmed) {
      setCreateModal((prev) => ({
        ...prev,
        error: 'Vui lòng điền đầy đủ tất cả thông tin.',
        isSubmitting: false,
      }));
      return;
    }

    try {
      const response = await axiosClient.post('/parent/create-student', {
        Username: usernameTrimmed,
        Password: createModal.password,
        Nickname: nicknameTrimmed,
      });

      if (response.data?.isSuccess) {
        showToast(response.data.message || 'Tạo tài khoản cho con thành công!', 'success');
        setCreateModal({
          isOpen: false,
          username: '',
          password: '',
          nickname: '',
          isSubmitting: false,
          error: '',
        });
        loadDashboardData();
      } else {
        setCreateModal((prev) => ({
          ...prev,
          error: response.data?.message || 'Không thể tạo tài khoản.',
          isSubmitting: false,
        }));
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Tên đăng nhập đã tồn tại hoặc lỗi hệ thống.';
      setCreateModal((prev) => ({ ...prev, error: msg, isSubmitting: false }));
    }
  };

  // Thống kê nhanh
  const totalPointsAll = students.reduce((sum, s) => sum + (s.totalPoints || 0), 0);
  const completedAssignmentsCount = assignments.filter((a) => a.status === 'Completed').length;

  return (
    <div className="parent-dashboard-page">
      {/* 1. Header Trang */}
      <div className="dashboard-header-card">
        <div className="dashboard-header-info">
          <h1>Bảng Điều Khiển Phụ Huynh</h1>
          <p>
            Đồng hành cùng việc học của con: Giám sát tiến độ, kiểm soát thời gian học và giao bài tập phù hợp.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={loadDashboardData}
            disabled={isLoading}
            title="Làm mới số liệu"
          >
            {isLoading ? 'Đang tải...' : 'Làm mới'}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setCreateModal((prev) => ({ ...prev, isOpen: true, error: '' }))}
          >
            Thêm tài khoản con
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="dashboard-alert-error">
          <span>{errorMsg}</span>
          <button type="button" onClick={loadDashboardData} className="btn-retry">
            Thử lại
          </button>
        </div>
      )}

      {/* 2. Thẻ số liệu thống kê */}
      <div className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-details">
            <span className="stat-label">Số con đang quản lý</span>
            <h3 className="stat-value">{students.length}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-details">
            <span className="stat-label">Tổng điểm thưởng tích lũy</span>
            <h3 className="stat-value">{totalPointsAll}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-details">
            <span className="stat-label">Nhiệm vụ đã giao</span>
            <h3 className="stat-value">{assignments.length}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-details">
            <span className="stat-label">Hoàn thành / Đang giao</span>
            <h3 className="stat-value">
              {completedAssignmentsCount} / {assignments.length - completedAssignmentsCount}
            </h3>
          </div>
        </div>
      </div>

      {/* 3. Danh sách hồ sơ các con */}
      <div className="dashboard-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Hồ sơ con cái</h2>
            <p className="section-subtitle">
              Xem nhanh điểm số, thời gian học mỗi ngày và truy cập báo cáo năng lực
            </p>
          </div>
          <Link to="/parent/children" className="section-link">
            Quản lý tất cả hồ sơ
          </Link>
        </div>

        {isLoading ? (
          <div className="dashboard-loading-card">Đang tải dữ liệu hồ sơ con...</div>
        ) : students.length === 0 ? (
          <div className="dashboard-empty-card">
            <h3>Chưa có hồ sơ học sinh nào</h3>
            <p>
              Ba mẹ hãy tạo tài khoản cho con để theo dõi tiến độ và giao bài tập bổ trợ môn Toán.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setCreateModal((prev) => ({ ...prev, isOpen: true, error: '' }))}
            >
              Tạo tài khoản cho con ngay
            </button>
          </div>
        ) : (
          <div className="children-cards-grid">
            {students.map((child) => {
              const letter = (child.nickname || child.username || 'C')[0].toUpperCase();
              return (
                <div key={child.studentId} className="child-summary-card">
                  <div className="child-card-header">
                    <div className="child-avatar">{letter}</div>
                    <div className="child-meta">
                      <h4 className="child-name">{child.nickname}</h4>
                      <span className="child-username">@{child.username}</span>
                    </div>
                    <span className="points-pill">{child.totalPoints || 0} điểm</span>
                  </div>

                  <div className="child-specs-list">
                    <div className="spec-item">
                      <span className="spec-label">Giới hạn học:</span>
                      <span className="spec-value">{child.timeLimitMinutes || 60} phút/ngày</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Mã học sinh:</span>
                      <span className="spec-value">#{child.studentId}</span>
                    </div>
                  </div>

                  <div className="child-card-actions">
                    <button
                      type="button"
                      className="btn-action-text"
                      onClick={() => navigate(`/parent/report?studentId=${child.studentId}`)}
                    >
                      Báo cáo năng lực
                    </button>
                    <button
                      type="button"
                      className="btn-action-text"
                      onClick={() => handleOpenTimeModal(child)}
                    >
                      Chỉnh giờ học
                    </button>
                    <button
                      type="button"
                      className="btn-action-text primary"
                      onClick={() => navigate(`/parent/assignments?studentId=${child.studentId}`)}
                    >
                      Giao bài
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Nhiệm vụ bài học gần đây */}
      <div className="dashboard-section" style={{ marginTop: '24px' }}>
        <div className="section-header">
          <div>
            <h2 className="section-title">Nhiệm vụ bài học gần đây</h2>
            <p className="section-subtitle">Theo dõi trạng thái các bài tập ba mẹ đã giao cho con</p>
          </div>
          <Link to="/parent/assignments" className="section-link">
            Xem toàn bộ bài tập
          </Link>
        </div>

        {assignments.length === 0 ? (
          <div className="dashboard-empty-card mini">
            <p>Ba mẹ chưa giao bài tập nào. Hãy chọn một bài học để giao cho con ôn luyện nhé!</p>
            <Link to="/parent/assignments" className="btn-secondary">
              Giao bài tập mới
            </Link>
          </div>
        ) : (
          <div className="dashboard-table-card">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Con</th>
                  <th>Bài học trực thuộc</th>
                  <th style={{ width: '180px' }}>Hạn hoàn thành</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {assignments.slice(0, 5).map((a) => {
                  const dueDate = a.dueDate ? new Date(a.dueDate).toLocaleDateString('vi-VN') : 'Không hạn';
                  const isCompleted = a.status === 'Completed';

                  return (
                    <tr key={a.assignmentId}>
                      <td>
                        <strong>{a.studentNickname || `#${a.studentId}`}</strong>
                      </td>
                      <td>{a.lessonTitle}</td>
                      <td>{dueDate}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-pill ${isCompleted ? 'completed' : 'assigned'}`}>
                          {isCompleted ? 'Hoàn thành' : 'Đang giao'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. MODAL: Cài đặt Giới hạn giờ học */}
      {timeModal.isOpen && timeModal.student && (
        <div className="modal-backdrop" onClick={() => setTimeModal({ isOpen: false, student: null, minutes: 60, isSubmitting: false })}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveTimeLimit}>
              <div className="modal-header">
                <h3>Cài đặt Giới hạn Giờ học</h3>
                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => setTimeModal({ isOpen: false, student: null, minutes: 60, isSubmitting: false })}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <p className="modal-desc">
                  Thiết lập thời gian học mỗi ngày cho bé:{' '}
                  <strong>{timeModal.student.nickname}</strong> (@{timeModal.student.username}).
                </p>

                <div className="form-group">
                  <label htmlFor="time-input">Thời gian học tối đa trong ngày (phút):</label>
                  <input
                    id="time-input"
                    type="number"
                    min="1"
                    max="240"
                    value={timeModal.minutes}
                    onChange={(e) => setTimeModal((prev) => ({ ...prev, minutes: e.target.value }))}
                    required
                  />
                  <span className="field-hint">Tối thiểu 1 phút, tối đa 240 phút (4 tiếng).</span>
                </div>

                <div className="quick-presets-wrap">
                  <span className="preset-label">Chọn nhanh:</span>
                  {[30, 45, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      className={`btn-preset ${parseInt(timeModal.minutes, 10) === mins ? 'active' : ''}`}
                      onClick={() => setTimeModal((prev) => ({ ...prev, minutes: mins }))}
                    >
                      {mins} phút
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setTimeModal({ isOpen: false, student: null, minutes: 60, isSubmitting: false })}
                  disabled={timeModal.isSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={timeModal.isSubmitting}
                >
                  {timeModal.isSubmitting ? 'Đang lưu...' : 'Lưu cài đặt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: Tạo tài khoản cho con */}
      {createModal.isOpen && (
        <div className="modal-backdrop" onClick={() => setCreateModal((prev) => ({ ...prev, isOpen: false }))}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreateStudent}>
              <div className="modal-header">
                <h3>Tạo Tài Khoản Cho Con</h3>
                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => setCreateModal((prev) => ({ ...prev, isOpen: false }))}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                {createModal.error && (
                  <div className="modal-error-alert">{createModal.error}</div>
                )}

                <div className="form-group">
                  <label htmlFor="child-nickname">Biệt danh của con (Nickname) *</label>
                  <input
                    id="child-nickname"
                    type="text"
                    placeholder="Ví dụ: Bé Bơ, Minh Khang..."
                    value={createModal.nickname}
                    onChange={(e) => setCreateModal((prev) => ({ ...prev, nickname: e.target.value }))}
                    required
                  />
                  <span className="field-hint">Tên gọi thân mật sẽ hiển thị trên ứng dụng.</span>
                </div>

                <div className="form-group">
                  <label htmlFor="child-username">Tên đăng nhập cho con *</label>
                  <input
                    id="child-username"
                    type="text"
                    placeholder="Ví dụ: bebo2018 (chỉ chữ, số và gạch dưới)"
                    value={createModal.username}
                    onChange={(e) => setCreateModal((prev) => ({ ...prev, username: e.target.value }))}
                    required
                  />
                  <span className="field-hint">Dùng để con đăng nhập vào ứng dụng học tập.</span>
                </div>

                <div className="form-group">
                  <label htmlFor="child-password">Mật khẩu đăng nhập cho con *</label>
                  <input
                    id="child-password"
                    type="password"
                    placeholder="Nhập mật khẩu..."
                    value={createModal.password}
                    onChange={(e) => setCreateModal((prev) => ({ ...prev, password: e.target.value }))}
                    required
                  />
                  <span className="field-hint">Mật khẩu dễ nhớ để con tự đăng nhập.</span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCreateModal((prev) => ({ ...prev, isOpen: false }))}
                  disabled={createModal.isSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createModal.isSubmitting}
                >
                  {createModal.isSubmitting ? 'Đang tạo...' : 'Xác nhận tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Toast Thông báo */}
      {toast.show && (
        <div className={`parent-toast ${toast.type}`}>
          <span className="toast-msg">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

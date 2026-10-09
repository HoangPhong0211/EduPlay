import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import './ChildManagement.css';

export default function ChildManagement() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal: Tạo tài khoản cho con
  const [createModal, setCreateModal] = useState({
    isOpen: false,
    username: '',
    password: '',
    nickname: '',
    isSubmitting: false,
    error: '',
  });

  // Modal: Cài đặt giới hạn thời gian học
  const [timeModal, setTimeModal] = useState({
    isOpen: false,
    student: null,
    minutes: 60,
    isSubmitting: false,
  });

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const response = await axiosClient.get('/parent/students');
      if (Array.isArray(response.data)) {
        setStudents(response.data);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách học sinh của phụ huynh:', err);
      showToast('Không thể tải danh sách tài khoản con.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Xử lý submit Tạo tài khoản học sinh
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
        loadStudents();
      } else {
        setCreateModal((prev) => ({
          ...prev,
          error: response.data?.message || 'Không thể tạo tài khoản cho con.',
          isSubmitting: false,
        }));
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Tên đăng nhập đã tồn tại hoặc gặp lỗi hệ thống.';
      setCreateModal((prev) => ({ ...prev, error: msg, isSubmitting: false }));
    }
  };

  // Xử lý lưu Giới hạn giờ học
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
        loadStudents();
      } else {
        showToast(response.data?.message || 'Không thể lưu giới hạn giờ học.', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.';
      showToast(msg, 'error');
    } finally {
      setTimeModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.nickname && s.nickname.toLowerCase().includes(q)) ||
      (s.username && s.username.toLowerCase().includes(q))
    );
  });

  return (
    <div className="childmgmt-page">
      {/* 1. Header Section */}
      <div className="childmgmt-header-card">
        <div className="childmgmt-header-info">
          <h1>Hồ Sơ Của Con</h1>
          <p>
            Quản lý tài khoản đăng nhập, điểm thưởng tích lũy và kiểm soát thời gian biểu học tập của các con.
          </p>
        </div>
        <div className="childmgmt-header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={loadStudents}
            disabled={isLoading}
          >
            {isLoading ? 'Đang tải...' : 'Làm mới'}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setCreateModal({ isOpen: true, username: '', password: '', nickname: '', isSubmitting: false, error: '' })}
          >
            Thêm tài khoản cho con
          </button>
        </div>
      </div>

      {/* 2. Toolbar & Tìm kiếm */}
      <div className="childmgmt-toolbar">
        <div className="search-box-wrap">
          <label htmlFor="search-child">Tìm kiếm:</label>
          <div className="search-input-box">
            <input
              id="search-child"
              type="text"
              placeholder="Tìm theo biệt danh hoặc tên đăng nhập..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="toolbar-counter">
          Tổng số: <strong>{filteredStudents.length}</strong> / {students.length} hồ sơ
        </div>
      </div>

      {/* 3. Danh sách học sinh */}
      {isLoading ? (
        <div className="childmgmt-loading-card">Đang nạp danh sách hồ sơ con...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="childmgmt-empty-card">
          <h3>
            {searchQuery ? 'Không tìm thấy hồ sơ phù hợp' : 'Chưa có tài khoản học sinh nào'}
          </h3>
          <p>
            {searchQuery
              ? 'Không có con nào khớp với từ khóa tìm kiếm.'
              : 'Ba mẹ hãy tạo tài khoản đầu tiên để con bắt đầu hành trình học Toán cùng EduPlay.'}
          </p>
          {!searchQuery && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setCreateModal({ isOpen: true, username: '', password: '', nickname: '', isSubmitting: false, error: '' })}
            >
              Tạo tài khoản cho con
            </button>
          )}
        </div>
      ) : (
        <div className="childmgmt-cards-grid">
          {filteredStudents.map((child) => {
            const letter = (child.nickname || child.username || 'C')[0].toUpperCase();
            const createdAtStr = child.createdAt
              ? new Date(child.createdAt).toLocaleDateString('vi-VN')
              : 'Gần đây';

            return (
              <div key={child.studentId} className="child-profile-card">
                <div className="profile-card-top">
                  <div className="child-avatar-big">{letter}</div>
                  <div className="child-info-block">
                    <h3 className="child-display-name">{child.nickname}</h3>
                    <span className="child-account-name">Tài khoản: @{child.username}</span>
                    <span className="child-id-tag">Mã ID: #{child.studentId}</span>
                  </div>
                  <div className="child-points-badge">
                    <span className="points-number">{child.totalPoints || 0}</span>
                    <span className="points-label">Điểm</span>
                  </div>
                </div>

                <div className="profile-card-body">
                  <div className="spec-row">
                    <span className="spec-title">Thời gian học mỗi ngày:</span>
                    <span className="spec-data highlighted">
                      {child.timeLimitMinutes || 60} phút
                    </span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-title">Ngày đăng ký:</span>
                    <span className="spec-data">{createdAtStr}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-title">Trạng thái:</span>
                    <span className="spec-data active">Đang hoạt động</span>
                  </div>
                </div>

                <div className="profile-card-footer">
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
                    onClick={() =>
                      setTimeModal({
                        isOpen: true,
                        student: child,
                        minutes: child.timeLimitMinutes || 60,
                        isSubmitting: false,
                      })
                    }
                  >
                    Chỉnh giờ học
                  </button>
                  <button
                    type="button"
                    className="btn-action-text primary"
                    onClick={() => navigate(`/parent/assignments?studentId=${child.studentId}`)}
                  >
                    Giao bài tập
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. MODAL: Tạo tài khoản cho con */}
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
                  <label htmlFor="modal-child-nickname">Biệt danh của con (Nickname) *</label>
                  <input
                    id="modal-child-nickname"
                    type="text"
                    placeholder="Ví dụ: Bé Bơ, Minh Khang..."
                    value={createModal.nickname}
                    onChange={(e) => setCreateModal((prev) => ({ ...prev, nickname: e.target.value }))}
                    required
                  />
                  <span className="field-hint">Tên gọi thân mật hiển thị khi con làm bài.</span>
                </div>

                <div className="form-group">
                  <label htmlFor="modal-child-username">Tên đăng nhập của con (Username) *</label>
                  <input
                    id="modal-child-username"
                    type="text"
                    placeholder="Ví dụ: bebo2018 (chỉ chữ, số và gạch dưới)"
                    value={createModal.username}
                    onChange={(e) => setCreateModal((prev) => ({ ...prev, username: e.target.value }))}
                    required
                  />
                  <span className="field-hint">Con sẽ dùng tên này cùng mật khẩu để đăng nhập.</span>
                </div>

                <div className="form-group">
                  <label htmlFor="modal-child-password">Mật khẩu đăng nhập *</label>
                  <input
                    id="modal-child-password"
                    type="password"
                    placeholder="Nhập mật khẩu..."
                    value={createModal.password}
                    onChange={(e) => setCreateModal((prev) => ({ ...prev, password: e.target.value }))}
                    required
                  />
                  <span className="field-hint">Nên đặt mật khẩu đơn giản, dễ nhớ đối với con.</span>
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

      {/* 5. MODAL: Cài đặt Giới hạn giờ học */}
      {timeModal.isOpen && timeModal.student && (
        <div className="modal-backdrop" onClick={() => setTimeModal({ isOpen: false, student: null, minutes: 60, isSubmitting: false })}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveTimeLimit}>
              <div className="modal-header">
                <h3>Cài Đặt Giới Hạn Giờ Học</h3>
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
                  Thiết lập thời lượng học trực tuyến mỗi ngày cho bé:{' '}
                  <strong>{timeModal.student.nickname}</strong> (@{timeModal.student.username}).
                </p>

                <div className="form-group">
                  <label htmlFor="modal-time-minutes">Thời gian học mỗi ngày (phút):</label>
                  <input
                    id="modal-time-minutes"
                    type="number"
                    min="1"
                    max="240"
                    value={timeModal.minutes}
                    onChange={(e) => setTimeModal((prev) => ({ ...prev, minutes: e.target.value }))}
                    required
                  />
                  <span className="field-hint">Quy định từ 1 đến 240 phút (tối đa 4 tiếng mỗi ngày).</span>
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

      {/* 6. Toast */}
      {toast.show && (
        <div className={`parent-toast ${toast.type}`}>
          <span className="toast-msg">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import './UserManagement.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Bộ lọc & Tìm kiếm
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Toast thông báo
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Modal xác nhận Khóa / Mở khóa
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    user: null,
    isSubmitting: false,
  });

  // Modal xem chi tiết người dùng
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    user: null,
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  }, []);

  // --------------------------------------------------------------------------
  // Tải danh sách người dùng từ Backend
  // --------------------------------------------------------------------------
  const loadUsers = useCallback(async (showSpinner = false) => {
    if (showSpinner) {
      setIsLoading(true);
    }
    try {
      const res = await axiosClient.get('/admin/users');
      const data = res.data?.data || [];
      setUsers(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
      showToast(err.response?.data?.message || 'Không thể tải danh sách người dùng!', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await axiosClient.get('/admin/users');
        if (!ignore) {
          setUsers(res.data?.data || []);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Lỗi khi tải danh sách người dùng:', err);
          showToast(err.response?.data?.message || 'Không thể tải danh sách người dùng!', 'error');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [showToast]);

  // --------------------------------------------------------------------------
  // Thống kê nhanh số lượng người dùng
  // --------------------------------------------------------------------------
  const stats = useMemo(() => {
    return {
      total: users.length,
      admin: users.filter((u) => u.role === 'Admin').length,
      parent: users.filter((u) => u.role === 'Parent').length,
      student: users.filter((u) => u.role === 'Student').length,
      active: users.filter((u) => u.isActive).length,
      locked: users.filter((u) => !u.isActive).length,
    };
  }, [users]);

  // --------------------------------------------------------------------------
  // Lọc và tìm kiếm người dùng
  // --------------------------------------------------------------------------
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      // Lọc theo Role
      if (selectedRole && u.role !== selectedRole) {
        return false;
      }

      // Lọc theo Trạng thái
      if (selectedStatus === 'active' && !u.isActive) {
        return false;
      }
      if (selectedStatus === 'locked' && u.isActive) {
        return false;
      }

      // Tìm kiếm theo Username, Email, Số điện thoại, Tên học sinh
      if (query) {
        const matchUsername = u.username?.toLowerCase().includes(query);
        const matchEmail = u.email?.toLowerCase().includes(query);
        const matchPhone = u.phoneNumber?.toLowerCase().includes(query);
        const matchNicknames = u.studentNicknames?.some((nick) =>
          nick.toLowerCase().includes(query)
        );

        if (!matchUsername && !matchEmail && !matchPhone && !matchNicknames) {
          return false;
        }
      }

      return true;
    });
  }, [users, selectedRole, selectedStatus, searchQuery]);

  // --------------------------------------------------------------------------
  // Xử lý Khóa / Mở khóa tài khoản
  // --------------------------------------------------------------------------
  const handleOpenToggleConfirm = (user) => {
    if (user.role === 'Admin') {
      showToast('Không thể khóa tài khoản Quản trị viên!', 'error');
      return;
    }
    setConfirmModal({
      isOpen: true,
      user: user,
      isSubmitting: false,
    });
  };

  const handleConfirmToggle = async () => {
    if (!confirmModal.user) return;

    setConfirmModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      const res = await axiosClient.patch(`/admin/users/${confirmModal.user.id}/toggle-status`);
      if (res.data?.isSuccess) {
        const actionText = confirmModal.user.isActive ? 'Khóa' : 'Mở khóa';
        showToast(res.data.message || `Đã ${actionText.toLowerCase()} tài khoản thành công!`, 'success');
        
        // Cập nhật trạng thái ngay trong state để UI đổi màu tức thì
        setUsers((prev) =>
          prev.map((item) =>
            item.id === confirmModal.user.id ? { ...item, isActive: !item.isActive } : item
          )
        );
        setConfirmModal({ isOpen: false, user: null, isSubmitting: false });
      } else {
        showToast(res.data?.message || 'Thao tác không thành công!', 'error');
      }
    } catch (err) {
      console.error('Lỗi thay đổi trạng thái người dùng:', err);
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi đổi trạng thái!', 'error');
    } finally {
      setConfirmModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Định dạng ngày giờ
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="usermgmt-wrapper">
      {/* 1. Header Trang */}
      <div className="usermgmt-header">
        <div className="usermgmt-header-info">
          <h1>
            <span>👥</span> Quản lý Người dùng
          </h1>
          <p>
            Xem danh sách tài khoản, phân quyền vai trò và quản trị trạng thái kích hoạt trong hệ thống EduPlay.
          </p>
        </div>
        <div className="usermgmt-header-actions">
          <button
            type="button"
            className="btn-refresh"
            onClick={() => loadUsers(true)}
            disabled={isLoading}
            title="Làm mới danh sách người dùng"
          >
            🔄 {isLoading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>

      {/* 2. Thống kê nhanh người dùng */}
      <div className="usermgmt-stats-grid">
        <div className="usermgmt-stat-card">
          <div className="stat-icon blue">👥</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <span>Tổng số tài khoản</span>
          </div>
        </div>

        <div className="usermgmt-stat-card">
          <div className="stat-icon purple">🛡️</div>
          <div className="stat-content">
            <h3>{stats.admin}</h3>
            <span>Quản trị viên</span>
          </div>
        </div>

        <div className="usermgmt-stat-card">
          <div className="stat-icon amber">👨‍👩‍👧</div>
          <div className="stat-content">
            <h3>{stats.parent}</h3>
            <span>Phụ huynh</span>
          </div>
        </div>

        <div className="usermgmt-stat-card">
          <div className="stat-icon green">🎒</div>
          <div className="stat-content">
            <h3>{stats.student}</h3>
            <span>Học sinh</span>
          </div>
        </div>

        <div className="usermgmt-stat-card">
          <div className="stat-icon status">
            <span className="dot-green" title="Đang hoạt động">🟢</span>
            <span className="dot-red" title="Đã bị khóa">🔴</span>
          </div>
          <div className="stat-content">
            <h3>{stats.active} <small style={{ fontSize: '14px', color: '#ef4444', fontWeight: 600 }}>/ {stats.locked} khóa</small></h3>
            <span>Trạng thái hoạt động</span>
          </div>
        </div>
      </div>

      {/* 3. Thanh điều khiển Bộ lọc & Tìm kiếm */}
      <div className="usermgmt-toolbar">
        {/* Lọc theo Vai trò */}
        <div className="filter-item">
          <label htmlFor="filter-role">Vai trò:</label>
          <select
            id="filter-role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="">Tất cả vai trò ({stats.total})</option>
            <option value="Admin">🛡️ Quản trị viên ({stats.admin})</option>
            <option value="Parent">👨‍👩‍👧 Phụ huynh ({stats.parent})</option>
            <option value="Student">🎒 Học sinh ({stats.student})</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái */}
        <div className="filter-item">
          <label htmlFor="filter-status">Trạng thái:</label>
          <select
            id="filter-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">🟢 Đang hoạt động ({stats.active})</option>
            <option value="locked">🔴 Đã bị khóa ({stats.locked})</option>
          </select>
        </div>

        {/* Ô Tìm kiếm */}
        <div className="search-box-wrap">
          <label htmlFor="user-search">Tìm kiếm:</label>
          <div className="search-input-box">
            <span className="search-icon">🔍</span>
            <input
              id="user-search"
              type="text"
              placeholder="Tìm theo username, tên học sinh, email, sđt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearchQuery('')}
                title="Xóa từ khóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Thông tin số lượng hiển thị */}
        <div className="toolbar-counter">
          <span>Hiển thị: <strong>{filteredUsers.length}</strong> / {users.length}</span>
        </div>
      </div>

      {/* 4. Bảng Dữ Liệu Người Dùng (Data Table) */}
      {isLoading ? (
        <div className="usermgmt-loading-card">
          <div className="loading-spinner">⏳</div>
          <div className="loading-text">Đang tải danh sách người dùng...</div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="usermgmt-empty-card">
          <div className="empty-icon">📭</div>
          <h3>Không tìm thấy người dùng phù hợp</h3>
          <p>
            {searchQuery || selectedRole || selectedStatus
              ? 'Không có tài khoản nào phù hợp với bộ lọc và từ khóa tìm kiếm hiện tại.'
              : 'Chưa có tài khoản nào được tạo trong hệ thống.'}
          </p>
          {(searchQuery || selectedRole || selectedStatus) && (
            <button
              type="button"
              className="btn-reset-filters"
              onClick={() => {
                setSelectedRole('');
                setSelectedStatus('');
                setSearchQuery('');
              }}
            >
              Xóa toàn bộ bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="usermgmt-table-card">
          <div className="table-responsive">
            <table className="usermgmt-table">
              <thead>
                <tr>
                  <th style={{ width: '65px' }}>ID</th>
                  <th>Tài khoản & Ngày tạo</th>
                  <th style={{ width: '150px' }}>Vai trò</th>
                  <th>Thông tin hồ sơ liên kết</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ width: '150px', textAlign: 'center' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const initialLetter = (u.username || 'U')[0].toUpperCase();
                  const isUserActive = u.isActive;
                  const isAdminUser = u.role === 'Admin';

                  return (
                    <tr key={u.id} className={!isUserActive ? 'row-locked' : ''}>
                      {/* Cột 1: ID */}
                      <td>
                        <span className="user-id-pill">#{u.id}</span>
                      </td>

                      {/* Cột 2: Tài khoản & Ngày tạo */}
                      <td>
                        <div className="user-profile-cell">
                          <div className={`user-avatar ${u.role.toLowerCase()}`}>
                            {initialLetter}
                          </div>
                          <div className="user-profile-info">
                            <span className="user-username">{u.username}</span>
                            <span className="user-created-at">
                              🕒 {formatDateTime(u.createdAt)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Vai trò */}
                      <td>
                        {u.role === 'Admin' && (
                          <span className="role-badge admin">
                            🛡️ Quản trị viên
                          </span>
                        )}
                        {u.role === 'Parent' && (
                          <span className="role-badge parent">
                            👨‍👩‍👧 Phụ huynh
                          </span>
                        )}
                        {u.role === 'Student' && (
                          <span className="role-badge student">
                            🎒 Học sinh
                          </span>
                        )}
                      </td>

                      {/* Cột 4: Thông tin hồ sơ liên kết */}
                      <td>
                        <div className="profile-details-cell">
                          {u.role === 'Parent' && (
                            <>
                              <div className="contact-info">
                                {u.email && <span>📧 {u.email}</span>}
                                {u.phoneNumber && <span>📞 {u.phoneNumber}</span>}
                                {!u.email && !u.phoneNumber && <span className="text-muted">Chưa cập nhật liên hệ</span>}
                              </div>
                              {u.studentNicknames && u.studentNicknames.length > 0 ? (
                                <div className="children-chips">
                                  <span className="children-label">Con:</span>
                                  {u.studentNicknames.map((nick, idx) => (
                                    <span key={idx} className="child-chip">
                                      👶 {nick}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="children-chips empty">
                                  <span>Chưa liên kết học sinh</span>
                                </div>
                              )}
                            </>
                          )}

                          {u.role === 'Student' && (
                            <div className="student-profile-summary">
                              {u.studentNicknames && u.studentNicknames.length > 0 && (
                                <span className="student-nickname">
                                  Biệt danh: <strong>{u.studentNicknames[0]}</strong>
                                </span>
                              )}
                              <span className="student-points-chip">
                                ⭐ {u.totalPoints || 0} điểm
                              </span>
                            </div>
                          )}

                          {u.role === 'Admin' && (
                            <span className="admin-privilege-text">
                              Toàn quyền quản trị hệ thống
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cột 5: Trạng thái */}
                      <td style={{ textAlign: 'center' }}>
                        {isUserActive ? (
                          <span className="status-pill active" title="Tài khoản đang hoạt động bình thường">
                            <span className="status-dot"></span> Hoạt động
                          </span>
                        ) : (
                          <span className="status-pill locked" title="Tài khoản đã bị khóa, không thể đăng nhập">
                            <span className="status-dot"></span> Đã khóa
                          </span>
                        )}
                      </td>

                      {/* Cột 6: Hành động */}
                      <td>
                        <div className="user-action-buttons">
                          {/* Nút Xem chi tiết */}
                          <button
                            type="button"
                            className="btn-action view"
                            onClick={() => setDetailsModal({ isOpen: true, user: u })}
                            title="Xem hồ sơ chi tiết người dùng"
                          >
                            👁️
                          </button>

                          {/* Nút Khóa / Mở khóa */}
                          {isUserActive ? (
                            <button
                              type="button"
                              className="btn-action lock"
                              onClick={() => handleOpenToggleConfirm(u)}
                              disabled={isAdminUser}
                              title={isAdminUser ? 'Không thể khóa tài khoản Admin' : 'Khóa tài khoản này'}
                            >
                              🔒 Khóa
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-action unlock"
                              onClick={() => handleOpenToggleConfirm(u)}
                              disabled={isAdminUser}
                              title="Mở khóa tài khoản này"
                            >
                              🔓 Mở
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. MODAL: Xác nhận Khóa / Mở khóa tài khoản */}
      {confirmModal.isOpen && confirmModal.user && (
        <div
          className="modal-backdrop"
          onClick={() => setConfirmModal({ isOpen: false, user: null, isSubmitting: false })}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon">
                  {confirmModal.user.isActive ? '🔒' : '🔓'}
                </span>
                <h3>
                  {confirmModal.user.isActive ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa tài khoản'}
                </h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setConfirmModal({ isOpen: false, user: null, isSubmitting: false })}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p className="confirm-desc">
                Bạn có chắc chắn muốn {confirmModal.user.isActive ? 'khóa' : 'mở khóa'} tài khoản:{' '}
                <strong className="target-username">@{confirmModal.user.username}</strong>?
              </p>

              {confirmModal.user.isActive ? (
                <div className="alert-callout danger">
                  <strong>⚠️ Lưu ý quan trọng:</strong> Khi bị khóa, người dùng này sẽ lập tức không thể đăng nhập vào ứng dụng và nhận thông báo liên hệ Quản trị viên.
                </div>
              ) : (
                <div className="alert-callout info">
                  <strong>ℹ️ Thông tin:</strong> Sau khi mở khóa, người dùng sẽ có thể đăng nhập và tiếp tục sử dụng ứng dụng bình thường.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setConfirmModal({ isOpen: false, user: null, isSubmitting: false })}
                disabled={confirmModal.isSubmitting}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className={`btn-modal-action ${confirmModal.user.isActive ? 'danger' : 'success'}`}
                onClick={handleConfirmToggle}
                disabled={confirmModal.isSubmitting}
              >
                {confirmModal.isSubmitting
                  ? 'Đang xử lý...'
                  : confirmModal.user.isActive
                  ? 'Đồng ý khóa'
                  : 'Đồng ý mở khóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: Xem Chi Tiết Người Dùng */}
      {detailsModal.isOpen && detailsModal.user && (
        <div
          className="modal-backdrop"
          onClick={() => setDetailsModal({ isOpen: false, user: null })}
        >
          <div className="modal-dialog details-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon">👤</span>
                <h3>Hồ sơ Người dùng</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setDetailsModal({ isOpen: false, user: null })}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Card định danh người dùng */}
              <div className="user-id-banner">
                <div className={`large-avatar ${detailsModal.user.role.toLowerCase()}`}>
                  {(detailsModal.user.username || 'U')[0].toUpperCase()}
                </div>
                <div className="banner-details">
                  <h4 className="banner-username">{detailsModal.user.username}</h4>
                  <div className="banner-badges">
                    <span className={`role-badge ${detailsModal.user.role.toLowerCase()}`}>
                      {detailsModal.user.role === 'Admin' && '🛡️ Quản trị viên'}
                      {detailsModal.user.role === 'Parent' && '👨‍👩‍👧 Phụ huynh'}
                      {detailsModal.user.role === 'Student' && '🎒 Học sinh'}
                    </span>
                    <span className={`status-pill ${detailsModal.user.isActive ? 'active' : 'locked'}`}>
                      {detailsModal.user.isActive ? '🟢 Đang hoạt động' : '🔴 Bị khóa'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chi tiết từng thuộc tính */}
              <div className="details-info-grid">
                <div className="info-row">
                  <span className="info-label">Mã số tài khoản (ID):</span>
                  <span className="info-value">#{detailsModal.user.id}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Ngày đăng ký tài khoản:</span>
                  <span className="info-value">{formatDateTime(detailsModal.user.createdAt)}</span>
                </div>

                {detailsModal.user.role === 'Parent' && (
                  <>
                    <div className="info-row">
                      <span className="info-label">Email liên hệ:</span>
                      <span className="info-value">{detailsModal.user.email || 'Chưa cung cấp'}</span>
                    </div>

                    <div className="info-row">
                      <span className="info-label">Số điện thoại:</span>
                      <span className="info-value">{detailsModal.user.phoneNumber || 'Chưa cung cấp'}</span>
                    </div>

                    <div className="info-row">
                      <span className="info-label">Học sinh được quản lý:</span>
                      <div className="info-value">
                        {detailsModal.user.studentNicknames && detailsModal.user.studentNicknames.length > 0 ? (
                          <div className="children-chips">
                            {detailsModal.user.studentNicknames.map((nick, idx) => (
                              <span key={idx} className="child-chip">
                                👶 {nick}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted">Chưa tạo hồ sơ học sinh</span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {detailsModal.user.role === 'Student' && (
                  <>
                    <div className="info-row">
                      <span className="info-label">Tên biệt danh (Nickname):</span>
                      <span className="info-value">
                        {detailsModal.user.studentNicknames?.[0] || detailsModal.user.username}
                      </span>
                    </div>

                    <div className="info-row">
                      <span className="info-label">Tổng điểm thưởng tích lũy:</span>
                      <span className="info-value" style={{ color: '#16a34a', fontWeight: 800 }}>
                        ⭐ {detailsModal.user.totalPoints || 0} điểm
                      </span>
                    </div>
                  </>
                )}

                {detailsModal.user.role === 'Admin' && (
                  <div className="info-row">
                    <span className="info-label">Quyền hạn hệ thống:</span>
                    <span className="info-value" style={{ color: '#7c3aed', fontWeight: 700 }}>
                      Quản lý Khóa học, Ngân hàng câu hỏi, Sinh đề & Quản trị tài khoản
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setDetailsModal({ isOpen: false, user: null })}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Toast Thông báo */}
      {toast.show && (
        <div className={`usermgmt-toast ${toast.type}`}>
          <span className="toast-icon">{toast.type === 'success' ? '✅' : '❌'}</span>
          <span className="toast-text">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default UserManagement;

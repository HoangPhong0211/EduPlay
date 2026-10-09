import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import './AssignmentManagement.css';

export default function AssignmentManagement() {
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form giao nhiệm vụ
  const [targetStudentId, setTargetStudentId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bộ lọc danh sách nhiệm vụ
  const [filterStudent, setFilterStudent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Mặc định ngày mai lúc 20:00 cho DueDate
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0);
    const localIso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setDueDate(localIso);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [studentsRes, lessonsRes, assignmentsRes] = await Promise.allSettled([
        axiosClient.get('/parent/students'),
        axiosClient.get('/parent/lessons'),
        axiosClient.get('/parent/assignments'),
      ]);

      if (studentsRes.status === 'fulfilled' && Array.isArray(studentsRes.value.data)) {
        setStudents(studentsRes.value.data);
        const paramId = searchParams.get('studentId');
        if (paramId && studentsRes.value.data.some((s) => String(s.studentId) === String(paramId))) {
          setTargetStudentId(paramId);
        } else if (studentsRes.value.data.length > 0) {
          setTargetStudentId(String(studentsRes.value.data[0].studentId));
        }
      }

      if (lessonsRes.status === 'fulfilled' && Array.isArray(lessonsRes.value.data)) {
        setLessons(lessonsRes.value.data);
        if (lessonsRes.value.data.length > 0) {
          setSelectedLessonId(String(lessonsRes.value.data[0].lessonId));
        }
      }

      if (assignmentsRes.status === 'fulfilled' && Array.isArray(assignmentsRes.value.data)) {
        setAssignments(assignmentsRes.value.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu giao bài tập:', err);
      showToast('Không thể tải dữ liệu bài tập.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Xử lý gửi Giao nhiệm vụ
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!targetStudentId) {
      showToast('Vui lòng chọn con cần giao bài.', 'error');
      return;
    }
    if (!selectedLessonId) {
      showToast('Vui lòng chọn bài học cần giao.', 'error');
      return;
    }
    if (!dueDate) {
      showToast('Vui lòng chọn hạn hoàn thành nhiệm vụ.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axiosClient.post('/parent/assignment', {
        StudentId: parseInt(targetStudentId, 10),
        LessonId: parseInt(selectedLessonId, 10),
        DueDate: new Date(dueDate).toISOString(),
      });

      if (response.data?.isSuccess) {
        showToast(response.data.message || 'Giao nhiệm vụ thành công!', 'success');
        // Tải lại danh sách nhiệm vụ
        const res = await axiosClient.get('/parent/assignments');
        if (Array.isArray(res.data)) {
          setAssignments(res.data);
        }
      } else {
        showToast(response.data?.message || 'Không thể giao bài tập.', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi giao nhiệm vụ.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lọc nhiệm vụ
  const filteredAssignments = assignments.filter((a) => {
    if (filterStudent && String(a.studentId) !== String(filterStudent)) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="assignmgmt-page">
      {/* 1. Header Section */}
      <div className="assignmgmt-header-card">
        <div className="assignmgmt-header-info">
          <h1>Giao Bài Tập Cho Con</h1>
          <p>
            Lựa chọn bài học phù hợp với chương trình học, đặt thời hạn và theo dõi mức độ hoàn thành nhiệm vụ của con.
          </p>
        </div>
        <div className="assignmgmt-header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={loadData}
            disabled={isLoading}
          >
            {isLoading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>

      <div className="assignmgmt-layout-grid">
        {/* ==================================================================
            CỘT TRÁI: FORM GIAO NHIỆM VỤ MỚI
            ================================================================== */}
        <div className="assign-form-col">
          <div className="assign-form-card">
            <div className="card-header-bar">
              <h2 className="card-header-title">Thiết lập nhiệm vụ mới</h2>
              <span className="card-header-sub">Chọn con, bài học và hạn hoàn thành</span>
            </div>

            {students.length === 0 && !isLoading ? (
              <div className="form-no-student-alert">
                <p>Ba mẹ chưa có hồ sơ con nào để giao bài.</p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => window.location.assign('/parent/children')}
                >
                  Tạo tài khoản con ngay
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateAssignment} className="assign-form">
                {/* 1. Chọn con */}
                <div className="form-field">
                  <label htmlFor="assign-student-select">Giao cho con: *</label>
                  <select
                    id="assign-student-select"
                    value={targetStudentId}
                    onChange={(e) => setTargetStudentId(e.target.value)}
                    required
                    disabled={isSubmitting || students.length === 0}
                  >
                    {students.map((s) => (
                      <option key={s.studentId} value={s.studentId}>
                        {s.nickname} (@{s.username})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Chọn bài học */}
                <div className="form-field">
                  <label htmlFor="assign-lesson-select">Bài học cần giao: *</label>
                  <select
                    id="assign-lesson-select"
                    value={selectedLessonId}
                    onChange={(e) => setSelectedLessonId(e.target.value)}
                    required
                    disabled={isSubmitting || lessons.length === 0}
                  >
                    {lessons.length === 0 ? (
                      <option value="">-- Đang nạp danh sách bài học --</option>
                    ) : (
                      lessons.map((l) => (
                        <option key={l.lessonId} value={l.lessonId}>
                          Lớp {l.gradeLevel} - {l.topicName}: Bài {l.orderIndex} - {l.title}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* 3. Hạn hoàn thành */}
                <div className="form-field">
                  <label htmlFor="assign-due-date">Hạn hoàn thành bài: *</label>
                  <input
                    id="assign-due-date"
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                  <span className="field-hint">
                    Hệ thống sẽ nhắc nhở con làm bài trước thời hạn này.
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn-primary btn-submit-assign"
                  disabled={isSubmitting || students.length === 0 || lessons.length === 0}
                >
                  {isSubmitting ? 'Đang gửi...' : 'Xác nhận giao nhiệm vụ'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ==================================================================
            CỘT PHẢI: DANH SÁCH NHIỆM VỤ ĐÃ GIAO
            ================================================================== */}
        <div className="assign-list-col">
          <div className="assign-list-card">
            <div className="list-card-header">
              <div>
                <h2 className="card-header-title">Danh sách bài tập đã giao</h2>
                <span className="card-header-sub">
                  Tổng số: {filteredAssignments.length} nhiệm vụ
                </span>
              </div>

              {/* Bộ lọc */}
              <div className="list-filters-wrap">
                <select
                  value={filterStudent}
                  onChange={(e) => setFilterStudent(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Tất cả các con</option>
                  {students.map((s) => (
                    <option key={s.studentId} value={s.studentId}>
                      {s.nickname}
                    </option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="Assigned">Đang giao</option>
                  <option value="Completed">Hoàn thành</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="assign-loading-box">Đang tải danh sách bài tập...</div>
            ) : filteredAssignments.length === 0 ? (
              <div className="assign-empty-box">
                <p>
                  {filterStudent || filterStatus
                    ? 'Không tìm thấy nhiệm vụ nào khớp với bộ lọc hiện tại.'
                    : 'Chưa có nhiệm vụ bài học nào được giao. Ba mẹ hãy chọn bài và giao ở cột bên trái nhé!'}
                </p>
              </div>
            ) : (
              <div className="assignments-table-wrap">
                <table className="assignments-table">
                  <thead>
                    <tr>
                      <th style={{ width: '130px' }}>Con</th>
                      <th>Bài học</th>
                      <th style={{ width: '150px' }}>Hạn chót</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.map((a) => {
                      const isCompleted = a.status === 'Completed';
                      const dueDateObj = a.dueDate ? new Date(a.dueDate) : null;
                      const isOverdue =
                        !isCompleted && dueDateObj && dueDateObj < new Date();

                      const formattedDue = dueDateObj
                        ? dueDateObj.toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                          })
                        : 'Không rõ';

                      return (
                        <tr key={a.assignmentId}>
                          <td>
                            <strong className="student-name-text">
                              {a.studentNickname || `#${a.studentId}`}
                            </strong>
                          </td>
                          <td>
                            <div className="lesson-info-wrap">
                              <span className="lesson-name-main">{a.lessonTitle}</span>
                              {a.topicName && (
                                <span className="lesson-topic-sub">{a.topicName}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`due-date-text ${isOverdue ? 'overdue' : ''}`}>
                              {formattedDue}
                            </span>
                            {isOverdue && <span className="overdue-tag">Quá hạn</span>}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              className={`status-pill ${
                                isCompleted ? 'completed' : 'assigned'
                              }`}
                            >
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
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className={`parent-toast ${toast.type}`}>
          <span className="toast-msg">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

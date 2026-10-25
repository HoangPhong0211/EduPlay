import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import './CourseManagement.css';

function CourseManagement() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(0); // 0 = all
  const [expandedTopics, setExpandedTopics] = useState(new Set());

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Modal states
  const [topicModal, setTopicModal] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit'
    id: null,
    gradeLevel: 1,
    name: '',
    description: '',
    isSubmitting: false,
  });

  const [lessonModal, setLessonModal] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit'
    id: null,
    topicId: null,
    topicName: '',
    title: '',
    orderIndex: 1,
    isSubmitting: false,
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: 'topic', // 'topic' | 'lesson'
    id: null,
    name: '',
    childLessonCount: 0,
    childQuestionCount: 0,
    isSubmitting: false,
  });

  // Helper: Hiển thị thông báo Toast
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  }, []);

  // 1. Tải danh sách Topics, Lessons và Questions từ Backend
  const loadData = useCallback(async (showSpinner = false) => {
    if (showSpinner) {
      setIsLoading(true);
    }
    try {
      const [topicsRes, lessonsRes, questionsRes] = await Promise.all([
        axiosClient.get('/admin/topics'),
        axiosClient.get('/admin/lessons'),
        axiosClient.get('/admin/questions'),
      ]);

      const loadedTopics = topicsRes.data?.data || [];
      const loadedLessons = lessonsRes.data?.data || [];
      const loadedQuestions = questionsRes.data?.data || [];

      setTopics(loadedTopics);
      setLessons(loadedLessons);
      setQuestions(loadedQuestions);

      // Tự động mở rộng tất cả topics nếu số lượng ít (<= 5) trong lần tải đầu
      setExpandedTopics((prev) => {
        if (prev.size === 0 && loadedTopics.length > 0) {
          return new Set(loadedTopics.map((t) => t.id));
        }
        return prev;
      });
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu khóa học:', err);
      showToast(err.response?.data?.message || 'Không thể tải danh sách khóa học và bài học', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [topicsRes, lessonsRes, questionsRes] = await Promise.all([
          axiosClient.get('/admin/topics'),
          axiosClient.get('/admin/lessons'),
          axiosClient.get('/admin/questions'),
        ]);
        if (!ignore) {
          const loadedTopics = topicsRes.data?.data || [];
          const loadedLessons = lessonsRes.data?.data || [];
          const loadedQuestions = questionsRes.data?.data || [];
          setTopics(loadedTopics);
          setLessons(loadedLessons);
          setQuestions(loadedQuestions);
          if (loadedTopics.length > 0) {
            setExpandedTopics(new Set(loadedTopics.map((t) => t.id)));
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error('Lỗi khi tải dữ liệu khóa học:', err);
          showToast(err.response?.data?.message || 'Không thể tải danh sách khóa học và bài học', 'error');
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

  // Nhóm lessons theo topicId
  const lessonsByTopic = useMemo(() => {
    const map = {};
    lessons.forEach((l) => {
      if (!map[l.topicId]) {
        map[l.topicId] = [];
      }
      map[l.topicId].push(l);
    });
    // Sắp xếp lessons theo orderIndex
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => a.orderIndex - b.orderIndex);
    });
    return map;
  }, [lessons]);

  // Đếm số lượng câu hỏi theo bài học và theo chủ đề
  const questionCountByLesson = useMemo(() => {
    const map = {};
    questions.forEach((q) => {
      map[q.lessonId] = (map[q.lessonId] || 0) + 1;
    });
    return map;
  }, [questions]);

  const questionCountByTopic = useMemo(() => {
    const map = {};
    questions.forEach((q) => {
      const parentLesson = lessons.find((l) => l.id === q.lessonId);
      if (parentLesson) {
        map[parentLesson.topicId] = (map[parentLesson.topicId] || 0) + 1;
      }
    });
    return map;
  }, [questions, lessons]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    return {
      totalTopics: topics.length,
      totalLessons: lessons.length,
      grade1: topics.filter((t) => t.gradeLevel === 1).length,
      grade2: topics.filter((t) => t.gradeLevel === 2).length,
      grade3: topics.filter((t) => t.gradeLevel === 3).length,
      grade4: topics.filter((t) => t.gradeLevel === 4).length,
      grade5: topics.filter((t) => t.gradeLevel === 5).length,
    };
  }, [topics, lessons]);

  // Lọc topics theo Grade và Search
  const filteredTopics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return topics.filter((t) => {
      const matchGrade = selectedGrade === 0 || t.gradeLevel === selectedGrade;
      if (!matchGrade) return false;

      if (!query) return true;

      const matchName = t.name?.toLowerCase().includes(query);
      const matchDesc = t.description?.toLowerCase().includes(query);
      // Tìm thấy cả trong tên bài học thuộc topic đó
      const topicLessons = lessonsByTopic[t.id] || [];
      const matchLesson = topicLessons.some((l) => l.title?.toLowerCase().includes(query));

      return matchName || matchDesc || matchLesson;
    });
  }, [topics, selectedGrade, searchQuery, lessonsByTopic]);

  // Toggle thu gọn / mở rộng một Topic
  const toggleExpand = (topicId) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  // Mở rộng tất cả / Thu gọn tất cả
  const expandAll = () => {
    setExpandedTopics(new Set(topics.map((t) => t.id)));
  };

  const collapseAll = () => {
    setExpandedTopics(new Set());
  };

  // ----------------------------------------------------
  // Xử lý TOPIC (Thêm / Sửa / Xóa)
  // ----------------------------------------------------
  const handleOpenCreateTopic = () => {
    setTopicModal({
      isOpen: true,
      mode: 'create',
      id: null,
      gradeLevel: selectedGrade > 0 ? selectedGrade : 1,
      name: '',
      description: '',
      isSubmitting: false,
    });
  };

  const handleOpenEditTopic = (topic, e) => {
    e.stopPropagation();
    setTopicModal({
      isOpen: true,
      mode: 'edit',
      id: topic.id,
      gradeLevel: topic.gradeLevel,
      name: topic.name,
      description: topic.description || '',
      isSubmitting: false,
    });
  };

  const handleSaveTopic = async (e) => {
    e.preventDefault();
    if (!topicModal.name.trim()) {
      showToast('Vui lòng nhập tên chương mục / khóa học!', 'error');
      return;
    }

    setTopicModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      const payload = {
        gradeLevel: parseInt(topicModal.gradeLevel, 10),
        name: topicModal.name.trim(),
        description: topicModal.description.trim() || null,
      };

      if (topicModal.mode === 'create') {
        const res = await axiosClient.post('/admin/topics', payload);
        showToast(res.data?.message || 'Thêm chương mục thành công!', 'success');
        // Tự động mở rộng topic vừa tạo
        if (res.data?.data?.id) {
          setExpandedTopics((prev) => new Set([...prev, res.data.data.id]));
        }
      } else {
        const res = await axiosClient.put(`/admin/topics/${topicModal.id}`, payload);
        showToast(res.data?.message || 'Cập nhật chương mục thành công!', 'success');
      }

      setTopicModal((prev) => ({ ...prev, isOpen: false }));
      await loadData();
    } catch (err) {
      console.error('Lỗi khi lưu chương mục:', err);
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi lưu chương mục!', 'error');
    } finally {
      setTopicModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // ----------------------------------------------------
  // Xử lý LESSON (Thêm / Sửa / Xóa)
  // ----------------------------------------------------
  const handleOpenCreateLesson = (topic, e) => {
    e.stopPropagation();
    const existingLessons = lessonsByTopic[topic.id] || [];
    const nextOrder = existingLessons.length > 0 ? Math.max(...existingLessons.map((l) => l.orderIndex)) + 1 : 1;

    setLessonModal({
      isOpen: true,
      mode: 'create',
      id: null,
      topicId: topic.id,
      topicName: topic.name,
      title: '',
      orderIndex: nextOrder,
      isSubmitting: false,
    });

    // Mở rộng topic đó ra để người dùng thấy ngay
    setExpandedTopics((prev) => new Set([...prev, topic.id]));
  };

  const handleOpenEditLesson = (lesson, topicName, e) => {
    e.stopPropagation();
    setLessonModal({
      isOpen: true,
      mode: 'edit',
      id: lesson.id,
      topicId: lesson.topicId,
      topicName: topicName,
      title: lesson.title,
      orderIndex: lesson.orderIndex,
      isSubmitting: false,
    });
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!lessonModal.title.trim()) {
      showToast('Vui lòng nhập tên bài học!', 'error');
      return;
    }
    if (lessonModal.orderIndex < 1) {
      showToast('Thứ tự bài học phải từ 1 trở lên!', 'error');
      return;
    }

    setLessonModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      const payload = {
        topicId: lessonModal.topicId,
        title: lessonModal.title.trim(),
        orderIndex: parseInt(lessonModal.orderIndex, 10),
      };

      if (lessonModal.mode === 'create') {
        const res = await axiosClient.post('/admin/lessons', payload);
        showToast(res.data?.message || 'Thêm bài học thành công!', 'success');
      } else {
        const res = await axiosClient.put(`/admin/lessons/${lessonModal.id}`, payload);
        showToast(res.data?.message || 'Cập nhật bài học thành công!', 'success');
      }

      setLessonModal((prev) => ({ ...prev, isOpen: false }));
      await loadData();
    } catch (err) {
      console.error('Lỗi khi lưu bài học:', err);
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi lưu bài học!', 'error');
    } finally {
      setLessonModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // ----------------------------------------------------
  // Xử lý XÓA (Delete Modal)
  // ----------------------------------------------------
  const handleOpenDeleteTopic = (topic, e) => {
    e.stopPropagation();
    const lessonCount = (lessonsByTopic[topic.id] || []).length;
    const qCount = questionCountByTopic[topic.id] || 0;
    setDeleteModal({
      isOpen: true,
      type: 'topic',
      id: topic.id,
      name: topic.name,
      childLessonCount: lessonCount,
      childQuestionCount: qCount,
      isSubmitting: false,
    });
  };

  const handleOpenDeleteLesson = (lesson, e) => {
    e.stopPropagation();
    const qCount = questionCountByLesson[lesson.id] || 0;
    setDeleteModal({
      isOpen: true,
      type: 'lesson',
      id: lesson.id,
      name: lesson.title,
      childLessonCount: 0,
      childQuestionCount: qCount,
      isSubmitting: false,
    });
  };

  const handleConfirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      if (deleteModal.type === 'topic') {
        const res = await axiosClient.delete(`/admin/topics/${deleteModal.id}`);
        showToast(res.data?.message || 'Đã xóa chương mục thành công!', 'success');
      } else {
        const res = await axiosClient.delete(`/admin/lessons/${deleteModal.id}`);
        showToast(res.data?.message || 'Đã xóa bài học thành công!', 'success');
      }

      setDeleteModal((prev) => ({ ...prev, isOpen: false }));
      await loadData();
    } catch (err) {
      console.error('Lỗi khi xóa:', err);
      showToast(err.response?.data?.message || 'Không thể xóa mục này!', 'error');
    } finally {
      setDeleteModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <div className="course-mgmt-container">
      {/* 1. Header Section */}
      <div className="mgmt-header">
        <div className="mgmt-header-info">
          <h1>Quản lý Khóa học & Bài học</h1>
          <p>Tổ chức chương trình học theo Khối lớp (Lớp 1 đến Lớp 5), phân cấp Chương mục và Bài học trực quan.</p>
        </div>
        <div className="mgmt-header-actions">
          <button type="button" className="btn-secondary" onClick={() => loadData(true)} title="Làm mới dữ liệu">
            Làm mới
          </button>
          <button type="button" className="btn-primary" onClick={handleOpenCreateTopic}>
            Thêm Chương mục
          </button>
        </div>
      </div>

      {/* 2. Thống kê nhanh (Stats Cards) */}
      <div className="mgmt-stats-grid">
        <div className="stat-card">
          <div className="stat-details">
            <span className="stat-label">Tổng số chương mục</span>
            <h3 className="stat-value">{stats.totalTopics}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-details">
            <span className="stat-label">Tổng số bài học</span>
            <h3 className="stat-value">{stats.totalLessons}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-details">
            <span className="stat-label">Chương trình Lớp 1</span>
            <h3 className="stat-value">{stats.grade1} chương</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-details">
            <span className="stat-label">Chương trình Lớp 2 &amp; 3</span>
            <h3 className="stat-value">{stats.grade2 + stats.grade3} chương</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-details">
            <span className="stat-label">Chương trình Lớp 4 &amp; 5</span>
            <h3 className="stat-value">{stats.grade4 + stats.grade5} chương</h3>
          </div>
        </div>
      </div>

      {/* 3. Bộ lọc & Tìm kiếm */}
      <div className="mgmt-controls">
        <div className="grade-filter-pills">
          <button
            type="button"
            className={`filter-pill ${selectedGrade === 0 ? 'active' : ''}`}
            onClick={() => setSelectedGrade(0)}
          >
            Tất cả khối lớp ({stats.totalTopics})
          </button>
          <button
            type="button"
            className={`filter-pill ${selectedGrade === 1 ? 'active' : ''}`}
            onClick={() => setSelectedGrade(1)}
          >
            Lớp 1 ({stats.grade1})
          </button>
          <button
            type="button"
            className={`filter-pill ${selectedGrade === 2 ? 'active' : ''}`}
            onClick={() => setSelectedGrade(2)}
          >
            Lớp 2 ({stats.grade2})
          </button>
          <button
            type="button"
            className={`filter-pill ${selectedGrade === 3 ? 'active' : ''}`}
            onClick={() => setSelectedGrade(3)}
          >
            Lớp 3 ({stats.grade3})
          </button>
          <button
            type="button"
            className={`filter-pill ${selectedGrade === 4 ? 'active' : ''}`}
            onClick={() => setSelectedGrade(4)}
          >
            Lớp 4 ({stats.grade4})
          </button>
          <button
            type="button"
            className={`filter-pill ${selectedGrade === 5 ? 'active' : ''}`}
            onClick={() => setSelectedGrade(5)}
          >
            Lớp 5 ({stats.grade5})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '13px' }}
            onClick={expandedTopics.size > 0 ? collapseAll : expandAll}
            title={expandedTopics.size > 0 ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
          >
            {expandedTopics.size > 0 ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
          </button>

          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm theo tên chương, bài học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Danh sách Khóa học & Bài học dạng Tree-View */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 600, color: '#475569' }}>Đang tải dữ liệu khóa học...</div>
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="empty-courses-card">
          <p>
            {searchQuery || selectedGrade > 0
              ? 'Không tìm thấy chương mục hoặc bài học nào phù hợp với bộ lọc hiện tại.'
              : 'Chưa có chương mục khóa học nào trong hệ thống.'}
          </p>
          {searchQuery || selectedGrade > 0 ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSelectedGrade(0);
                setSearchQuery('');
              }}
            >
              Xóa bộ lọc
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={handleOpenCreateTopic}>
              Tạo chương mục đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="tree-view-wrapper">
          {filteredTopics.map((topic) => {
            const isExpanded = expandedTopics.has(topic.id);
            const topicLessons = lessonsByTopic[topic.id] || [];

            return (
              <div key={topic.id} className="topic-node">
                {/* Header của Topic */}
                <div className="topic-header" onClick={() => toggleExpand(topic.id)}>
                  <div className="topic-title-area">
                    <span className={`expand-chevron ${isExpanded ? 'expanded' : ''}`}>›</span>
                    <span className="grade-badge">Lớp {topic.gradeLevel}</span>
                    <div className="topic-name-wrap">
                      <div className="topic-name">{topic.name}</div>
                      {topic.description && <div className="topic-desc">{topic.description}</div>}
                    </div>
                  </div>

                  <div className="topic-actions-area">
                    <span className="lesson-count-tag">{topicLessons.length} bài học</span>

                    <button
                      type="button"
                      className="btn-action-text add-lesson"
                      title="Thêm bài học vào chương này"
                      onClick={(e) => handleOpenCreateLesson(topic, e)}
                    >
                      Thêm bài
                    </button>

                    <button
                      type="button"
                      className="btn-action-text"
                      title="Sửa chương mục"
                      onClick={(e) => handleOpenEditTopic(topic, e)}
                    >
                      Sửa
                    </button>

                    <button
                      type="button"
                      className="btn-action-text delete"
                      title="Xóa chương mục"
                      onClick={(e) => handleOpenDeleteTopic(topic, e)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                {/* Danh sách Bài học bên trong Topic (Drawer) */}
                {isExpanded && (
                  <div className="lessons-container">
                    {topicLessons.length === 0 ? (
                      <div className="empty-lessons-notice">
                        Chưa có bài học nào trong chương mục này.{' '}
                        <button
                          type="button"
                          onClick={(e) => handleOpenCreateLesson(topic, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563eb',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          Thêm bài học đầu tiên
                        </button>
                      </div>
                    ) : (
                      <div className="lesson-list">
                        {topicLessons.map((lesson) => (
                          <div key={lesson.id} className="lesson-item">
                            <div className="lesson-info">
                              <span className="order-pill" title={`Thứ tự: ${lesson.orderIndex}`}>
                                {lesson.orderIndex}
                              </span>
                              <span className="lesson-title">{lesson.title}</span>
                              <span className="lesson-q-count">
                                {questionCountByLesson[lesson.id] || 0} câu hỏi
                              </span>
                            </div>

                            <div className="lesson-actions">
                              <button
                                type="button"
                                className="btn-action-text"
                                title="Chuyển sang Ngân hàng câu hỏi của bài này"
                                onClick={() => navigate(`/admin/questions?lessonId=${lesson.id}`)}
                              >
                                Xem câu hỏi
                              </button>
                              <button
                                type="button"
                                className="btn-action-text"
                                title="Sửa bài học"
                                onClick={(e) => handleOpenEditLesson(lesson, topic.name, e)}
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                className="btn-action-text delete"
                                title="Xóa bài học"
                                onClick={(e) => handleOpenDeleteLesson(lesson, e)}
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. MODAL: Thêm / Sửa Topic */}
      {topicModal.isOpen && (
        <div className="modal-overlay" onClick={() => setTopicModal((prev) => ({ ...prev, isOpen: false }))}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveTopic}>
              <div className="modal-header">
                <h3>{topicModal.mode === 'create' ? 'Thêm Chương mục' : 'Cập nhật Chương mục'}</h3>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setTopicModal((prev) => ({ ...prev, isOpen: false }))}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="topic-grade">Khối lớp *</label>
                  <select
                    id="topic-grade"
                    value={topicModal.gradeLevel}
                    onChange={(e) =>
                      setTopicModal((prev) => ({ ...prev, gradeLevel: parseInt(e.target.value, 10) }))
                    }
                    required
                  >
                    <option value={1}>Lớp 1</option>
                    <option value={2}>Lớp 2</option>
                    <option value={3}>Lớp 3</option>
                    <option value={4}>Lớp 4</option>
                    <option value={5}>Lớp 5</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="topic-name">Tên chương mục / Khóa học *</label>
                  <input
                    id="topic-name"
                    type="text"
                    placeholder="Ví dụ: Phép cộng trong phạm vi 10"
                    value={topicModal.name}
                    onChange={(e) => setTopicModal((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="topic-desc">Mô tả tóm tắt (tùy chọn)</label>
                  <textarea
                    id="topic-desc"
                    placeholder="Mô tả mục tiêu kiến thức của chương này..."
                    value={topicModal.description}
                    onChange={(e) => setTopicModal((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setTopicModal((prev) => ({ ...prev, isOpen: false }))}
                  disabled={topicModal.isSubmitting}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-primary" disabled={topicModal.isSubmitting}>
                  {topicModal.isSubmitting ? 'Đang lưu...' : topicModal.mode === 'create' ? 'Tạo chương mục' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: Thêm / Sửa Lesson */}
      {lessonModal.isOpen && (
        <div className="modal-overlay" onClick={() => setLessonModal((prev) => ({ ...prev, isOpen: false }))}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveLesson}>
              <div className="modal-header">
                <h3>{lessonModal.mode === 'create' ? 'Thêm Bài học' : 'Cập nhật Bài học'}</h3>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setLessonModal((prev) => ({ ...prev, isOpen: false }))}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Thuộc chương mục</label>
                  <div
                    style={{
                      padding: '10px 14px',
                      background: '#f1f5f9',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: '#334155',
                    }}
                  >
                    {lessonModal.topicName}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="lesson-title">Tên bài học *</label>
                  <input
                    id="lesson-title"
                    type="text"
                    placeholder="Ví dụ: Bài 1: Đếm số từ 1 đến 5"
                    value={lessonModal.title}
                    onChange={(e) => setLessonModal((prev) => ({ ...prev, title: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lesson-order">Thứ tự hiển thị (Order Index) *</label>
                  <input
                    id="lesson-order"
                    type="number"
                    min="1"
                    value={lessonModal.orderIndex}
                    onChange={(e) =>
                      setLessonModal((prev) => ({ ...prev, orderIndex: parseInt(e.target.value, 10) || 1 }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setLessonModal((prev) => ({ ...prev, isOpen: false }))}
                  disabled={lessonModal.isSubmitting}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-primary" disabled={lessonModal.isSubmitting}>
                  {lessonModal.isSubmitting ? 'Đang lưu...' : lessonModal.mode === 'create' ? 'Thêm bài học' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: Xác nhận Xóa */}
      {deleteModal.isOpen && (
        <div className="modal-overlay" onClick={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Xác nhận xóa</h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>
                Bạn có chắc chắn muốn xóa {deleteModal.type === 'topic' ? 'chương mục' : 'bài học'}:{' '}
                <strong style={{ color: '#0f172a' }}>"{deleteModal.name}"</strong>?
              </p>

              {deleteModal.type === 'topic' && (deleteModal.childLessonCount > 0 || deleteModal.childQuestionCount > 0) && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    color: '#991b1b',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}
                >
                  <strong>Lưu ý:</strong> Chương mục này hiện chứa{' '}
                  <strong>{deleteModal.childLessonCount} bài học</strong> và{' '}
                  <strong>{deleteModal.childQuestionCount} câu hỏi</strong>. Việc xóa chương mục sẽ đồng thời xóa các bài học và câu hỏi liên quan bên trong.
                </div>
              )}

              {deleteModal.type === 'lesson' && deleteModal.childQuestionCount > 0 && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    color: '#991b1b',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}
                >
                  <strong>Lưu ý:</strong> Bài học này hiện chứa{' '}
                  <strong>{deleteModal.childQuestionCount} câu hỏi</strong>. Khi xóa, tất cả câu hỏi thuộc bài học này sẽ được xóa khỏi ngân hàng câu hỏi.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={deleteModal.isSubmitting}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn-delete-confirm"
                onClick={handleConfirmDelete}
                disabled={deleteModal.isSubmitting}
              >
                {deleteModal.isSubmitting ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Toast Thông báo */}
      {toast.show && (
        <div className={`mgmt-toast ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default CourseManagement;

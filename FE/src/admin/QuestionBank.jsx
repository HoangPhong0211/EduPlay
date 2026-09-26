import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import './QuestionBank.css';

function QuestionBank() {
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  // Dữ liệu chính
  const [questions, setQuestions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Bộ lọc
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedQuestionType, setSelectedQuestionType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // 1. Modal Upload File Excel (Hộp thoại Thêm câu hỏi)
  const [uploadModal, setUploadModal] = useState({
    isOpen: false,
    topicId: '',
    lessonId: '',
    file: null,
    isDragOver: false,
    isUploading: false,
  });

  // 2. Modal Chỉnh sửa một câu hỏi (Edit)
  const [editModal, setEditModal] = useState({
    isOpen: false,
    id: null,
    topicId: '',
    lessonId: '',
    content: '',
    questionType: 'Trắc nghiệm',
    difficultyLevel: 'Dễ',
    correctAnswer: '',
    hint: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    isSubmitting: false,
  });

  // 3. Modal Xem & Duyệt Gợi ý AI (AI Hint Review & Confirm)
  const [aiModal, setAiModal] = useState({
    isOpen: false,
    question: null,
    hintText: '',
    isLoading: false,
    isSaving: false,
  });

  // 4. Modal Xác nhận Xóa
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    content: '',
    isSubmitting: false,
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  }, []);

  // Tải toàn bộ dữ liệu từ Backend
  const loadData = useCallback(async (showSpinner = false) => {
    if (showSpinner) {
      setIsLoading(true);
    }
    try {
      const [questionsRes, topicsRes, lessonsRes] = await Promise.all([
        axiosClient.get('/admin/questions'),
        axiosClient.get('/admin/topics'),
        axiosClient.get('/admin/lessons'),
      ]);

      setQuestions(questionsRes.data?.data || []);
      setTopics(topicsRes.data?.data || []);
      setLessons(lessonsRes.data?.data || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu ngân hàng câu hỏi:', err);
      showToast(err.response?.data?.message || 'Không thể tải dữ liệu câu hỏi!', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [questionsRes, topicsRes, lessonsRes] = await Promise.all([
          axiosClient.get('/admin/questions'),
          axiosClient.get('/admin/topics'),
          axiosClient.get('/admin/lessons'),
        ]);
        if (!ignore) {
          const loadedQuestions = questionsRes.data?.data || [];
          const loadedTopics = topicsRes.data?.data || [];
          const loadedLessons = lessonsRes.data?.data || [];

          setQuestions(loadedQuestions);
          setTopics(loadedTopics);
          setLessons(loadedLessons);

          // Tự động nhận diện param ?lessonId= từ URL
          const paramLessonId = searchParams.get('lessonId');
          if (paramLessonId) {
            setSelectedLessonId(paramLessonId);
            const foundLesson = loadedLessons.find((l) => l.id === parseInt(paramLessonId, 10));
            if (foundLesson) {
              setSelectedTopicId(String(foundLesson.topicId));
            }
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error('Lỗi tải dữ liệu ngân hàng câu hỏi:', err);
          showToast(err.response?.data?.message || 'Không thể tải dữ liệu câu hỏi!', 'error');
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
  }, [showToast, searchParams]);

  // Từ điển tra cứu nhanh
  const topicMap = useMemo(() => {
    const map = {};
    topics.forEach((t) => {
      map[t.id] = t;
    });
    return map;
  }, [topics]);

  const lessonMap = useMemo(() => {
    const map = {};
    lessons.forEach((l) => {
      map[l.id] = l;
    });
    return map;
  }, [lessons]);

  // Bài học thuộc Topic được chọn trong bộ lọc
  const filteredFilterLessons = useMemo(() => {
    if (!selectedTopicId) return lessons;
    return lessons.filter((l) => l.topicId === parseInt(selectedTopicId, 10));
  }, [lessons, selectedTopicId]);

  // Bài học thuộc Topic trong Upload Modal
  const uploadModalLessons = useMemo(() => {
    if (!uploadModal.topicId) return lessons;
    return lessons.filter((l) => l.topicId === parseInt(uploadModal.topicId, 10));
  }, [lessons, uploadModal.topicId]);

  // Bài học thuộc Topic trong Edit Modal
  const editModalLessons = useMemo(() => {
    if (!editModal.topicId) return lessons;
    return lessons.filter((l) => l.topicId === parseInt(editModal.topicId, 10));
  }, [lessons, editModal.topicId]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    return {
      total: questions.length,
      easy: questions.filter((q) => q.difficultyLevel === 'Dễ').length,
      medium: questions.filter((q) => q.difficultyLevel === 'Trung bình').length,
      hard: questions.filter((q) => q.difficultyLevel === 'Khó').length,
      choice: questions.filter((q) => !q.questionType || q.questionType === 'Trắc nghiệm').length,
      fill: questions.filter((q) => q.questionType === 'Điền đáp án').length,
      withHint: questions.filter((q) => q.hint && q.hint.trim().length > 0).length,
      withoutHint: questions.filter((q) => !q.hint || q.hint.trim().length === 0).length,
    };
  }, [questions]);

  // Lọc câu hỏi hiển thị trong bảng
  const filteredQuestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return questions.filter((q) => {
      if (selectedTopicId) {
        const lesson = lessonMap[q.lessonId];
        if (!lesson || lesson.topicId !== parseInt(selectedTopicId, 10)) return false;
      }

      if (selectedLessonId && q.lessonId !== parseInt(selectedLessonId, 10)) {
        return false;
      }

      if (selectedDifficulty && q.difficultyLevel !== selectedDifficulty) {
        return false;
      }

      if (selectedQuestionType) {
        const qType = q.questionType || 'Trắc nghiệm';
        if (qType !== selectedQuestionType) return false;
      }

      if (query) {
        const matchContent = q.content?.toLowerCase().includes(query);
        const matchAnswer = q.correctAnswer?.toLowerCase().includes(query);
        const matchHint = q.hint?.toLowerCase().includes(query);
        const matchOptA = q.optionA?.toLowerCase().includes(query);
        const matchOptB = q.optionB?.toLowerCase().includes(query);
        const matchOptC = q.optionC?.toLowerCase().includes(query);
        const matchOptD = q.optionD?.toLowerCase().includes(query);
        const lessonTitle = lessonMap[q.lessonId]?.title?.toLowerCase() || '';
        const matchLesson = lessonTitle.includes(query);
        if (
          !matchContent &&
          !matchAnswer &&
          !matchHint &&
          !matchLesson &&
          !matchOptA &&
          !matchOptB &&
          !matchOptC &&
          !matchOptD
        ) {
          return false;
        }
      }

      return true;
    });
  }, [questions, selectedTopicId, selectedLessonId, selectedDifficulty, selectedQuestionType, searchQuery, lessonMap]);

  // Định dạng kích thước file
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // ----------------------------------------------------
  // 1. Xử lý UPLOAD FILE EXCEL (Hộp thoại Thêm câu hỏi)
  // ----------------------------------------------------
  const handleOpenUpload = () => {
    const defaultTopicId = selectedTopicId || (topics.length > 0 ? String(topics[0].id) : '');
    const availableForTopic = defaultTopicId
      ? lessons.filter((l) => l.topicId === parseInt(defaultTopicId, 10))
      : lessons;
    const defaultLessonId = selectedLessonId || (availableForTopic.length > 0 ? String(availableForTopic[0].id) : '');

    setUploadModal({
      isOpen: true,
      topicId: defaultTopicId,
      lessonId: defaultLessonId,
      file: null,
      isDragOver: false,
      isUploading: false,
    });
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith('.xlsx')) {
      showToast('Hệ thống chỉ chấp nhận file định dạng Excel (.xlsx)!', 'error');
      return;
    }
    setUploadModal((prev) => ({
      ...prev,
      file: selectedFile,
      isDragOver: false,
    }));
  };

  const handleUploadExcel = async (e) => {
    e.preventDefault();
    if (!uploadModal.file) {
      showToast('Vui lòng chọn hoặc kéo thả một file Excel .xlsx vào khung!', 'error');
      return;
    }

    setUploadModal((prev) => ({ ...prev, isUploading: true }));
    try {
      const formData = new FormData();
      formData.append('file', uploadModal.file);
      if (uploadModal.lessonId) {
        formData.append('defaultLessonId', uploadModal.lessonId);
      }

      const res = await axiosClient.post('/admin/import-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.isSuccess) {
        showToast(res.data.message || 'Tải dữ liệu câu hỏi thành công!', 'success');
        // Tự động chuyển bộ lọc sang bài học vừa nạp để Admin thấy ngay câu hỏi mới
        if (uploadModal.topicId) setSelectedTopicId(uploadModal.topicId);
        if (uploadModal.lessonId) setSelectedLessonId(uploadModal.lessonId);
        setUploadModal((prev) => ({ ...prev, isOpen: false }));
        await loadData();
      } else {
        showToast(res.data?.message || 'Tải dữ liệu thất bại!', 'error');
      }
    } catch (err) {
      console.error('Lỗi khi tải file Excel lên:', err);
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý file Excel!', 'error');
    } finally {
      setUploadModal((prev) => ({ ...prev, isUploading: false }));
    }
  };

  // ----------------------------------------------------
  // 2. Xử lý GỢI Ý BẰNG AI (Xem trước & Lưu vào CSDL)
  // ----------------------------------------------------
  const handleOpenAiModal = async (q) => {
    const parentLesson = lessonMap[q.lessonId];
    const parentTopic = parentLesson ? topicMap[parentLesson.topicId] : null;
    const grade = parentTopic?.gradeLevel || 1;

    setAiModal({
      isOpen: true,
      question: q,
      hintText: q.hint || '',
      isLoading: true,
      isSaving: false,
    });

    try {
      const res = await axiosClient.post('/admin/generate-hints', {
        questionContent: q.content,
        gradeLevel: grade,
      });

      if (res.data?.isSuccess && res.data?.message) {
        setAiModal((prev) => ({
          ...prev,
          hintText: res.data.message,
          isLoading: false,
        }));
      } else {
        showToast(res.data?.message || 'Không thể tạo gợi ý từ AI.', 'error');
        setAiModal((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (err) {
      console.error('Lỗi gọi AI Hints:', err);
      showToast(err.response?.data?.message || 'Có lỗi khi kết nối với AI.', 'error');
      setAiModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleSaveAiHint = async () => {
    if (!aiModal.question) return;
    if (!aiModal.hintText.trim()) {
      showToast('Gợi ý không được để trống!', 'error');
      return;
    }

    setAiModal((prev) => ({ ...prev, isSaving: true }));
    try {
      const res = await axiosClient.put(`/admin/questions/${aiModal.question.id}/hint`, {
        hint: aiModal.hintText.trim(),
      });

      if (res.data?.isSuccess) {
        showToast('Đã lưu gợi ý vào cơ sở dữ liệu thành công!', 'success');
        // Cập nhật trực tiếp vào danh sách câu hỏi trong state để UI đổi màu ngay lập tức
        setQuestions((prev) =>
          prev.map((item) =>
            item.id === aiModal.question.id ? { ...item, hint: aiModal.hintText.trim() } : item
          )
        );
        setAiModal((prev) => ({ ...prev, isOpen: false }));
      } else {
        showToast(res.data?.message || 'Không thể lưu gợi ý.', 'error');
      }
    } catch (err) {
      console.error('Lỗi khi lưu gợi ý AI:', err);
      showToast(err.response?.data?.message || 'Lỗi khi lưu gợi ý.', 'error');
    } finally {
      setAiModal((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // ----------------------------------------------------
  // 3. Xử lý SỬA một câu hỏi lẻ (Edit Modal)
  // ----------------------------------------------------
  const handleOpenEdit = (q) => {
    const parentLesson = lessonMap[q.lessonId];
    setEditModal({
      isOpen: true,
      id: q.id,
      topicId: parentLesson ? String(parentLesson.topicId) : '',
      lessonId: String(q.lessonId),
      content: q.content,
      questionType: q.questionType || 'Trắc nghiệm',
      difficultyLevel: q.difficultyLevel,
      correctAnswer: q.correctAnswer,
      hint: q.hint || '',
      optionA: q.optionA || '',
      optionB: q.optionB || '',
      optionC: q.optionC || '',
      optionD: q.optionD || '',
      isSubmitting: false,
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editModal.content.trim()) {
      showToast('Nội dung câu hỏi không được để trống!', 'error');
      return;
    }
    if (!editModal.correctAnswer.trim()) {
      showToast('Đáp án đúng không được để trống!', 'error');
      return;
    }

    setEditModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      const isMultipleChoice = editModal.questionType === 'Trắc nghiệm';
      const payload = {
        lessonId: parseInt(editModal.lessonId, 10),
        content: editModal.content.trim(),
        questionType: editModal.questionType,
        difficultyLevel: editModal.difficultyLevel,
        correctAnswer: editModal.correctAnswer.trim(),
        hint: editModal.hint.trim() || null,
        optionA: isMultipleChoice && editModal.optionA ? editModal.optionA.trim() : null,
        optionB: isMultipleChoice && editModal.optionB ? editModal.optionB.trim() : null,
        optionC: isMultipleChoice && editModal.optionC ? editModal.optionC.trim() : null,
        optionD: isMultipleChoice && editModal.optionD ? editModal.optionD.trim() : null,
      };

      const res = await axiosClient.put(`/admin/questions/${editModal.id}`, payload);
      showToast(res.data?.message || 'Cập nhật câu hỏi thành công!', 'success');
      setEditModal((prev) => ({ ...prev, isOpen: false }));
      await loadData();
    } catch (err) {
      console.error('Lỗi cập nhật câu hỏi:', err);
      showToast(err.response?.data?.message || 'Không thể cập nhật câu hỏi!', 'error');
    } finally {
      setEditModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // ----------------------------------------------------
  // 4. Xử lý XÓA Câu hỏi
  // ----------------------------------------------------
  const handleOpenDelete = (q) => {
    setDeleteModal({
      isOpen: true,
      id: q.id,
      content: q.content,
      isSubmitting: false,
    });
  };

  const handleConfirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      const res = await axiosClient.delete(`/admin/questions/${deleteModal.id}`);
      showToast(res.data?.message || 'Đã xóa câu hỏi thành công!', 'success');
      setDeleteModal((prev) => ({ ...prev, isOpen: false }));
      await loadData();
    } catch (err) {
      console.error('Lỗi khi xóa câu hỏi:', err);
      const errorMsg =
        err.response?.data?.message ||
        'Không thể xóa câu hỏi này vì đã có học sinh làm bài hoặc gặp lỗi ràng buộc dữ liệu!';
      showToast(errorMsg, 'error');
    } finally {
      setDeleteModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <div className="qbank-container">
      {/* 1. Header Section */}
      <div className="qbank-header">
        <div className="qbank-header-info">
          <h1>
            <span>📝</span> Ngân hàng Câu hỏi
          </h1>
          <p>Nhập liệu bán tự động qua file Excel, quản lý kho câu hỏi và tối ưu hóa gợi ý bằng AI.</p>
        </div>
        <div className="qbank-header-actions">
          <button type="button" className="btn-secondary" onClick={() => loadData(true)} title="Làm mới dữ liệu">
            🔄 Làm mới
          </button>
          <button type="button" className="btn-primary" onClick={handleOpenUpload} title="Tải file Excel để nhập hàng loạt câu hỏi">
            📥 Thêm câu hỏi (Excel)
          </button>
        </div>
      </div>

      {/* 2. Thống kê nhanh */}
      <div className="qbank-stats-grid">
        <div className="qbank-stat-card">
          <div className="qbank-stat-icon blue">📚</div>
          <div className="qbank-stat-details">
            <h3>{stats.total}</h3>
            <span>Tổng số câu hỏi</span>
          </div>
        </div>
        <div className="qbank-stat-card">
          <div className="qbank-stat-icon green">🌱</div>
          <div className="qbank-stat-details">
            <h3>{stats.easy}</h3>
            <span>Độ khó Dễ</span>
          </div>
        </div>
        <div className="qbank-stat-card">
          <div className="qbank-stat-icon amber">⚖️</div>
          <div className="qbank-stat-details">
            <h3>{stats.medium}</h3>
            <span>Độ khó Trung bình</span>
          </div>
        </div>
        <div className="qbank-stat-card">
          <div className="qbank-stat-icon purple">🔥</div>
          <div className="qbank-stat-details">
            <h3>{stats.hard}</h3>
            <span>Độ khó Khó</span>
          </div>
        </div>
      </div>

      {/* 3. Thanh điều khiển Bộ lọc & Tìm kiếm */}
      <div className="qbank-toolbar">
        <div className="filter-group">
          <label htmlFor="filter-topic">Chương mục:</label>
          <select
            id="filter-topic"
            value={selectedTopicId}
            onChange={(e) => {
              setSelectedTopicId(e.target.value);
              setSelectedLessonId('');
            }}
          >
            <option value="">Tất cả chương mục</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                Lớp {t.gradeLevel}: {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-lesson">Bài học:</label>
          <select
            id="filter-lesson"
            value={selectedLessonId}
            onChange={(e) => setSelectedLessonId(e.target.value)}
          >
            <option value="">Tất cả bài học</option>
            {filteredFilterLessons.map((l) => (
              <option key={l.id} value={l.id}>
                Bài {l.orderIndex}: {l.title}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-diff">Độ khó:</label>
          <select
            id="filter-diff"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            <option value="">Tất cả độ khó</option>
            <option value="Dễ">Dễ</option>
            <option value="Trung bình">Trung bình</option>
            <option value="Khó">Khó</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-qtype">Loại câu:</label>
          <select
            id="filter-qtype"
            value={selectedQuestionType}
            onChange={(e) => setSelectedQuestionType(e.target.value)}
          >
            <option value="">Tất cả loại ({stats.total})</option>
            <option value="Trắc nghiệm">🔘 Trắc nghiệm ({stats.choice})</option>
            <option value="Điền đáp án">✍️ Điền đáp án ({stats.fill})</option>
          </select>
        </div>

        <div className="search-wrap">
          <label htmlFor="q-search">Tìm kiếm:</label>
          <div className="search-input-box">
            <span className="search-icon">🔍</span>
            <input
              id="q-search"
              type="text"
              placeholder="Tìm theo nội dung, đáp án, gợi ý..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                aria-label="Xóa từ khóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Danh sách câu hỏi (Data Table) */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <div style={{ fontWeight: 600, color: '#475569' }}>Đang tải danh sách câu hỏi...</div>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="empty-qbank-card">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <p>
            {searchQuery || selectedTopicId || selectedLessonId || selectedDifficulty
              ? 'Không tìm thấy câu hỏi nào phù hợp với bộ lọc hiện tại.'
              : 'Chưa có câu hỏi nào trong ngân hàng dữ liệu.'}
          </p>
          {searchQuery || selectedTopicId || selectedLessonId || selectedDifficulty ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSelectedTopicId('');
                setSelectedLessonId('');
                setSelectedDifficulty('');
                setSelectedQuestionType('');
                setSearchQuery('');
              }}
            >
              Xóa toàn bộ bộ lọc
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={handleOpenUpload}>
              📥 Tải file Excel đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="qbank-table-card">
          <table className="qbank-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Nội dung bài toán & Phương án</th>
                <th style={{ width: '130px' }}>Loại câu</th>
                <th style={{ width: '260px' }}>Gợi ý (AI Hint)</th>
                <th style={{ width: '100px' }}>Độ khó</th>
                <th style={{ width: '130px' }}>Đáp án đúng</th>
                <th style={{ width: '90px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((q) => {
                const parentLesson = lessonMap[q.lessonId];
                const parentTopic = parentLesson ? topicMap[parentLesson.topicId] : null;
                const hasHint = Boolean(q.hint && q.hint.trim().length > 0);
                const isChoice = !q.questionType || q.questionType === 'Trắc nghiệm';
                const hasOptions = Boolean(q.optionA || q.optionB || q.optionC || q.optionD);

                return (
                  <tr key={q.id}>
                    <td>
                      <span className="q-id-pill">#{q.id}</span>
                    </td>
                    <td>
                      <div className="q-content-wrap">
                        <div className="q-content-text">{q.content}</div>
                        {hasOptions && (
                          <div className="q-options-list">
                            {q.optionA && (
                              <span
                                className={`q-option-chip ${
                                  q.correctAnswer === 'A' || q.correctAnswer === q.optionA ? 'correct' : ''
                                }`}
                              >
                                <strong className="q-opt-tag">A.</strong> {q.optionA}
                              </span>
                            )}
                            {q.optionB && (
                              <span
                                className={`q-option-chip ${
                                  q.correctAnswer === 'B' || q.correctAnswer === q.optionB ? 'correct' : ''
                                }`}
                              >
                                <strong className="q-opt-tag">B.</strong> {q.optionB}
                              </span>
                            )}
                            {q.optionC && (
                              <span
                                className={`q-option-chip ${
                                  q.correctAnswer === 'C' || q.correctAnswer === q.optionC ? 'correct' : ''
                                }`}
                              >
                                <strong className="q-opt-tag">C.</strong> {q.optionC}
                              </span>
                            )}
                            {q.optionD && (
                              <span
                                className={`q-option-chip ${
                                  q.correctAnswer === 'D' || q.correctAnswer === q.optionD ? 'correct' : ''
                                }`}
                              >
                                <strong className="q-opt-tag">D.</strong> {q.optionD}
                              </span>
                            )}
                          </div>
                        )}
                        {parentLesson && (
                          <div className="q-lesson-badge">
                            📖 {parentLesson.title}
                            {parentTopic && ` • Lớp ${parentTopic.gradeLevel}`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {isChoice ? (
                        <span className="qtype-badge choice">🔘 Trắc nghiệm</span>
                      ) : (
                        <span className="qtype-badge fill">✍️ Điền đáp án</span>
                      )}
                    </td>
                    <td>
                      {/* Vị trí mới cho Gợi ý & Nút ✨ Gọi AI */}
                      {hasHint ? (
                        <div className="table-hint-cell">
                          <div className="table-hint-text" title={q.hint}>
                            💡 {q.hint}
                          </div>
                          <button
                            type="button"
                            className="btn-edit-hint"
                            onClick={() => handleOpenAiModal(q)}
                            title="Bấm để xem và cập nhật gợi ý AI"
                          >
                            ✏️ Đổi gợi ý
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-call-ai"
                          onClick={() => handleOpenAiModal(q)}
                          title="Lấy nội dung bài toán này gửi đến AI để sinh gợi ý hướng dẫn sửa sai"
                        >
                          ✨ Gọi AI
                        </button>
                      )}
                    </td>
                    <td>
                      <span
                        className={`difficulty-badge ${
                          q.difficultyLevel === 'Dễ'
                            ? 'easy'
                            : q.difficultyLevel === 'Trung bình'
                            ? 'medium'
                            : 'hard'
                        }`}
                      >
                        {q.difficultyLevel}
                      </span>
                    </td>
                    <td>
                      <span className="answer-chip">{q.correctAnswer}</span>
                    </td>
                    <td>
                      <div className="q-actions" style={{ justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="btn-icon edit"
                          title="Sửa câu hỏi"
                          onClick={() => handleOpenEdit(q)}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn-icon delete"
                          title="Xóa câu hỏi"
                          onClick={() => handleOpenDelete(q)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. MODAL: Upload File Excel (Hộp thoại Thêm câu hỏi cấu trúc mới) */}
      {uploadModal.isOpen && (
        <div className="modal-overlay" onClick={() => setUploadModal((prev) => ({ ...prev, isOpen: false }))}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleUploadExcel}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>📥</span>
                  <h3 style={{ margin: 0 }}>Nhập liệu bán tự động qua file Excel</h3>
                </div>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setUploadModal((prev) => ({ ...prev, isOpen: false }))}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                {/* 1. Bộ lọc danh mục (Giữ nguyên ở trên cùng) */}
                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="upload-topic">Chương mục *</label>
                    <select
                      id="upload-topic"
                      value={uploadModal.topicId}
                      onChange={(e) => {
                        const newTopicId = e.target.value;
                        const matchingLessons = lessons.filter(
                          (l) => l.topicId === parseInt(newTopicId, 10)
                        );
                        setUploadModal((prev) => ({
                          ...prev,
                          topicId: newTopicId,
                          lessonId: matchingLessons.length > 0 ? String(matchingLessons[0].id) : '',
                        }));
                      }}
                      required
                    >
                      <option value="">-- Chọn Chương mục --</option>
                      {topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          Lớp {t.gradeLevel}: {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="upload-lesson">Bài học trực thuộc *</label>
                    <select
                      id="upload-lesson"
                      value={uploadModal.lessonId}
                      onChange={(e) =>
                        setUploadModal((prev) => ({ ...prev, lessonId: e.target.value }))
                      }
                      required
                    >
                      <option value="">-- Chọn Bài học --</option>
                      {uploadModalLessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          Bài {l.orderIndex}: {l.title} (ID: {l.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2 & 3. Khu vực Upload & Trạng thái File */}
                <div className="form-group" style={{ marginTop: '8px' }}>
                  <label>Tệp tin dữ liệu câu hỏi (.xlsx) *</label>
                  
                  {!uploadModal.file ? (
                    // Khu vực Upload (Mới): Khung viền đứt nét (dashed border)
                    <div
                      className={`upload-dropzone ${uploadModal.isDragOver ? 'dragover' : ''}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setUploadModal((prev) => ({ ...prev, isDragOver: true }));
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setUploadModal((prev) => ({ ...prev, isDragOver: false }));
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const droppedFile = e.dataTransfer.files?.[0];
                        handleFileSelect(droppedFile);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".xlsx"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileSelect(e.target.files[0]);
                          }
                        }}
                      />
                      <div className="upload-icon">☁️</div>
                      <div className="upload-title">Kéo thả file .xlsx vào đây hoặc bấm để chọn file</div>
                      <div className="upload-subtitle">
                        Định dạng chuẩn 9 cột: <strong>Cột B</strong> (Nội dung) • <strong>Cột C</strong> (Loại câu) • <strong>Cột D</strong> (Độ khó) • <strong>Cột E</strong> (Đáp án) • <strong>Cột F, G, H, I</strong> (Phương án A, B, C, D).
                      </div>
                    </div>
                  ) : (
                    // Trạng thái file (Mới): Khung chuyển thành thanh ngang hiển thị tên file, dung lượng và nút (X)
                    <div className="upload-file-status">
                      <div className="file-info-group">
                        <span className="file-icon">📊</span>
                        <div className="file-details">
                          <div className="file-name">{uploadModal.file.name}</div>
                          <div className="file-size">{formatFileSize(uploadModal.file.size)} • Sẵn sàng tải lên</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-remove-file"
                        onClick={() => {
                          setUploadModal((prev) => ({ ...prev, file: null }));
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        title="Hủy chọn file này"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div className="upload-guideline-box">
                  <p>
                    💡 <strong>Cấu trúc file Excel mới (Hỗ trợ Trắc nghiệm & Điền đáp án):</strong>
                  </p>
                  <ul className="guideline-columns-list">
                    <li><strong>Cột B (Cell 2):</strong> Nội dung câu hỏi (Content)</li>
                    <li><strong>Cột C (Cell 3):</strong> Loại câu hỏi (<em>"Trắc nghiệm"</em> hoặc <em>"Điền đáp án"</em>)</li>
                    <li><strong>Cột D (Cell 4):</strong> Độ khó (<em>"Dễ"</em>, <em>"Trung bình"</em>, <em>"Khó"</em>)</li>
                    <li><strong>Cột E (Cell 5):</strong> Đáp án đúng (CorrectAnswer)</li>
                    <li><strong>Cột F, G, H, I (Cell 6, 7, 8, 9):</strong> Lần lượt là Phương án A, B, C, D (cho câu hỏi Trắc nghiệm)</li>
                    <li className="guideline-subtext">
                      <em>* Cột A (Cell 1): ID bài học (tùy chọn; nếu để trống hệ thống sẽ tự động gán vào bài học được chọn ở trên). Phần gợi ý (Hint) sẽ để trống để sinh tự động qua AI.</em>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 4. Nút hành động: "Tải dữ liệu lên" */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setUploadModal((prev) => ({ ...prev, isOpen: false }))}
                  disabled={uploadModal.isUploading}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!uploadModal.file || uploadModal.isUploading}
                >
                  {uploadModal.isUploading ? '⏳ Đang nạp dữ liệu...' : '🚀 Tải dữ liệu lên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: Đọc lướt & Chốt Gợi ý AI (AI Hint Review & Confirm) */}
      {aiModal.isOpen && (
        <div className="modal-overlay" onClick={() => setAiModal((prev) => ({ ...prev, isOpen: false }))}>
          <div className="modal-content" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>✨</span>
                <h3 style={{ margin: 0 }}>Gợi ý Sư phạm từ AI</h3>
                <span className="badge-ai-pill">Hybrid AI</span>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setAiModal((prev) => ({ ...prev, isOpen: false }))}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Nội dung câu hỏi context */}
              <div className="ai-question-callout">
                <div className="ai-callout-label">Nội dung bài toán (#{aiModal.question?.id}):</div>
                <div className="ai-callout-text">{aiModal.question?.content}</div>
                <div className="ai-callout-meta">
                  <span>Đáp án đúng: <strong>{aiModal.question?.correctAnswer}</strong></span>
                  <span>Độ khó: <strong>{aiModal.question?.difficultyLevel}</strong></span>
                </div>
              </div>

              {/* Khung soạn thảo/chốt gợi ý */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label htmlFor="ai-hint-textarea" style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>
                    Hướng dẫn sửa sai do AI đề xuất:
                  </label>
                  <button
                    type="button"
                    className="btn-regenerate-ai"
                    onClick={() => handleOpenAiModal(aiModal.question)}
                    disabled={aiModal.isLoading || aiModal.isSaving}
                    title="Yêu cầu AI sinh lại gợi ý khác"
                  >
                    🔄 Sinh lại
                  </button>
                </div>

                {aiModal.isLoading ? (
                  <div className="ai-loading-box">
                    <div className="ai-spinner">⏳</div>
                    <p>AI đang phân tích bài toán và soạn thảo 3 câu gợi ý sư phạm phù hợp lứa tuổi...</p>
                  </div>
                ) : (
                  <textarea
                    id="ai-hint-textarea"
                    rows={5}
                    className="ai-hint-input"
                    value={aiModal.hintText}
                    onChange={(e) => setAiModal((prev) => ({ ...prev, hintText: e.target.value }))}
                    placeholder="Quản trị viên có thể đọc lướt qua và chỉnh sửa gợi ý tại đây trước khi chốt lưu..."
                  />
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setAiModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={aiModal.isSaving}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveAiHint}
                disabled={aiModal.isLoading || aiModal.isSaving || !aiModal.hintText.trim()}
              >
                {aiModal.isSaving ? '💾 Đang lưu...' : '💾 Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: Sửa câu hỏi lẻ (Edit Question) */}
      {editModal.isOpen && (
        <div className="modal-overlay" onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-header">
                <h3>✏️ Cập nhật Câu hỏi #{editModal.id}</h3>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="edit-topic">Chương mục *</label>
                    <select
                      id="edit-topic"
                      value={editModal.topicId}
                      onChange={(e) => {
                        const newTopicId = e.target.value;
                        const matchingLessons = lessons.filter(
                          (l) => l.topicId === parseInt(newTopicId, 10)
                        );
                        setEditModal((prev) => ({
                          ...prev,
                          topicId: newTopicId,
                          lessonId: matchingLessons.length > 0 ? String(matchingLessons[0].id) : '',
                        }));
                      }}
                      required
                    >
                      <option value="">-- Chọn Chương --</option>
                      {topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          Lớp {t.gradeLevel}: {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-lesson">Bài học *</label>
                    <select
                      id="edit-lesson"
                      value={editModal.lessonId}
                      onChange={(e) =>
                        setEditModal((prev) => ({ ...prev, lessonId: e.target.value }))
                      }
                      required
                    >
                      <option value="">-- Chọn Bài học --</option>
                      {editModalLessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          Bài {l.orderIndex}: {l.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="edit-type">Loại câu hỏi *</label>
                    <select
                      id="edit-type"
                      value={editModal.questionType}
                      onChange={(e) =>
                        setEditModal((prev) => ({ ...prev, questionType: e.target.value }))
                      }
                      required
                    >
                      <option value="Trắc nghiệm">🔘 Trắc nghiệm</option>
                      <option value="Điền đáp án">✍️ Điền đáp án (Tự luận ngắn)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-diff">Mức độ khó *</label>
                    <select
                      id="edit-diff"
                      value={editModal.difficultyLevel}
                      onChange={(e) =>
                        setEditModal((prev) => ({ ...prev, difficultyLevel: e.target.value }))
                      }
                      required
                    >
                      <option value="Dễ">Dễ</option>
                      <option value="Trung bình">Trung bình</option>
                      <option value="Khó">Khó</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-content">Nội dung câu hỏi *</label>
                  <textarea
                    id="edit-content"
                    rows={3}
                    value={editModal.content}
                    onChange={(e) =>
                      setEditModal((prev) => ({ ...prev, content: e.target.value }))
                    }
                    required
                  />
                </div>

                {/* 4 phương án lựa chọn khi là câu hỏi Trắc nghiệm */}
                {editModal.questionType === 'Trắc nghiệm' && (
                  <div className="options-edit-box">
                    <div className="options-edit-label">4 Phương án trắc nghiệm (A, B, C, D):</div>
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label htmlFor="edit-opt-a" style={{ fontSize: '12px' }}>Phương án A:</label>
                        <input
                          id="edit-opt-a"
                          type="text"
                          placeholder="Ví dụ: 12 bông hoa"
                          value={editModal.optionA}
                          onChange={(e) =>
                            setEditModal((prev) => ({ ...prev, optionA: e.target.value }))
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="edit-opt-b" style={{ fontSize: '12px' }}>Phương án B:</label>
                        <input
                          id="edit-opt-b"
                          type="text"
                          placeholder="Ví dụ: 15 bông hoa"
                          value={editModal.optionB}
                          onChange={(e) =>
                            setEditModal((prev) => ({ ...prev, optionB: e.target.value }))
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="edit-opt-c" style={{ fontSize: '12px' }}>Phương án C:</label>
                        <input
                          id="edit-opt-c"
                          type="text"
                          placeholder="Ví dụ: 18 bông hoa"
                          value={editModal.optionC}
                          onChange={(e) =>
                            setEditModal((prev) => ({ ...prev, optionC: e.target.value }))
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="edit-opt-d" style={{ fontSize: '12px' }}>Phương án D:</label>
                        <input
                          id="edit-opt-d"
                          type="text"
                          placeholder="Ví dụ: 20 bông hoa"
                          value={editModal.optionD}
                          onChange={(e) =>
                            setEditModal((prev) => ({ ...prev, optionD: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="edit-ans">Đáp án đúng *</label>
                  <input
                    id="edit-ans"
                    type="text"
                    value={editModal.correctAnswer}
                    onChange={(e) =>
                      setEditModal((prev) => ({ ...prev, correctAnswer: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-hint">Gợi ý giải bài</label>
                  <textarea
                    id="edit-hint"
                    rows={3}
                    placeholder="Gợi ý sửa sai khi học sinh trả lời sai..."
                    value={editModal.hint}
                    onChange={(e) =>
                      setEditModal((prev) => ({ ...prev, hint: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
                  disabled={editModal.isSubmitting}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-primary" disabled={editModal.isSubmitting}>
                  {editModal.isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: Xác nhận Xóa */}
      {deleteModal.isOpen && (
        <div className="modal-overlay" onClick={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Xác nhận xóa câu hỏi</h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ margin: 0, fontSize: '15px', color: '#334155', lineHeight: 1.6 }}>
                Bạn có chắc chắn muốn xóa câu hỏi:{' '}
                <strong style={{ color: '#0f172a' }}>"{deleteModal.content}"</strong>?
              </p>
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  color: '#991b1b',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  marginTop: '12px',
                }}
              >
                Lưu ý: Không thể hoàn tác hành động này. Nếu câu hỏi đã có học sinh làm bài ghi nhận lịch sử, hệ thống sẽ từ chối xóa để bảo vệ dữ liệu.
              </div>
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

      {/* 9. Toast Thông báo */}
      {toast.show && (
        <div className={`mgmt-toast ${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default QuestionBank;

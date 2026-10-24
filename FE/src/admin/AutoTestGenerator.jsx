import { useState, useEffect, useMemo, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import './AutoTestGenerator.css';

// ============================================================================
// 1. API Services (Bóc tách riêng các hàm gọi API)
// ============================================================================
const fetchTopicsApi = async () => {
  const res = await axiosClient.get('/admin/topics');
  return res.data?.data || [];
};

const fetchLessonsByTopicApi = async (topicId) => {
  const res = await axiosClient.get(`/admin/lessons?topicId=${topicId}`);
  return res.data?.data || [];
};

const fetchQuestionsByLessonApi = async (lessonId) => {
  const res = await axiosClient.get(`/admin/questions?lessonId=${lessonId}`);
  return res.data?.data || [];
};

const generateAutoTestApi = async (payload) => {
  const res = await axiosClient.post('/admin/generate-test', payload);
  return res.data;
};

const publishTestApi = async (payload) => {
  const res = await axiosClient.post('/admin/publish-test', payload);
  return res.data;
};

// ============================================================================
// 2. Component Chính: AutoTestGenerator
// ============================================================================
function AutoTestGenerator() {
  // Dữ liệu danh mục
  const [topics, setTopics] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [lessonQuestions, setLessonQuestions] = useState([]);

  // Trạng thái Form Cấu hình (Cột trái)
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [easyCount, setEasyCount] = useState(3);
  const [mediumCount, setMediumCount] = useState(2);
  const [hardCount, setHardCount] = useState(1);

  // Trạng thái Loading
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Dữ liệu Đề thi đã sinh (Cột phải - Preview & Publish)
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [generatedMeta, setGeneratedMeta] = useState(null);

  // Thông báo Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  }, []);

  // --------------------------------------------------------------------------
  // Chọn Bài học -> Nạp danh sách câu hỏi để thống kê kho
  // --------------------------------------------------------------------------
  const handleSelectLesson = useCallback(async (lessonId) => {
    setSelectedLessonId(lessonId);
    if (!lessonId) {
      setLessonQuestions([]);
      return;
    }
    try {
      const qList = await fetchQuestionsByLessonApi(lessonId);
      setLessonQuestions(qList);
    } catch (err) {
      console.error('Lỗi kiểm tra kho câu hỏi bài học:', err);
    }
  }, []);

  // --------------------------------------------------------------------------
  // Chọn Topic -> Nạp danh sách Lessons và tự động chọn bài học đầu tiên
  // --------------------------------------------------------------------------
  const handleSelectTopic = useCallback(async (topicId) => {
    setSelectedTopicId(topicId);
    if (!topicId) {
      setLessons([]);
      setSelectedLessonId('');
      setLessonQuestions([]);
      return;
    }
    setIsLoadingLessons(true);
    try {
      const lessonList = await fetchLessonsByTopicApi(topicId);
      setLessons(lessonList);
      if (lessonList.length > 0) {
        const firstLessonId = String(lessonList[0].id);
        setSelectedLessonId(firstLessonId);
        const qList = await fetchQuestionsByLessonApi(firstLessonId);
        setLessonQuestions(qList);
      } else {
        setSelectedLessonId('');
        setLessonQuestions([]);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách bài học:', err);
      showToast(err.response?.data?.message || 'Không thể tải danh sách bài học!', 'error');
    } finally {
      setIsLoadingLessons(false);
    }
  }, [showToast]);

  // --------------------------------------------------------------------------
  // Tải danh sách Topics ban đầu
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    async function loadInitial() {
      setIsLoadingTopics(true);
      try {
        const topicList = await fetchTopicsApi();
        if (!isMounted) return;
        setTopics(topicList);

        if (topicList.length > 0) {
          const firstTopicId = String(topicList[0].id);
          setSelectedTopicId(firstTopicId);
          setIsLoadingLessons(true);
          const lessonList = await fetchLessonsByTopicApi(firstTopicId);
          if (!isMounted) return;
          setLessons(lessonList);

          if (lessonList.length > 0) {
            const firstLessonId = String(lessonList[0].id);
            setSelectedLessonId(firstLessonId);
            const qList = await fetchQuestionsByLessonApi(firstLessonId);
            if (!isMounted) return;
            setLessonQuestions(qList);
          }
          setIsLoadingLessons(false);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Lỗi tải danh sách chương mục:', err);
        showToast(err.response?.data?.message || 'Không thể tải danh sách chương mục!', 'error');
      } finally {
        if (isMounted) setIsLoadingTopics(false);
      }
    }

    loadInitial();
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  // Tra cứu Topic & Lesson đang chọn
  const activeTopic = useMemo(() => {
    return topics.find((t) => t.id === parseInt(selectedTopicId, 10)) || null;
  }, [topics, selectedTopicId]);

  const activeLesson = useMemo(() => {
    return lessons.find((l) => l.id === parseInt(selectedLessonId, 10)) || null;
  }, [lessons, selectedLessonId]);

  // Thống kê số lượng câu hỏi có sẵn trong kho bài học
  const inventoryStats = useMemo(() => {
    return {
      total: lessonQuestions.length,
      easy: lessonQuestions.filter((q) => q.difficultyLevel === 'Dễ').length,
      medium: lessonQuestions.filter((q) => q.difficultyLevel === 'Trung bình').length,
      hard: lessonQuestions.filter((q) => q.difficultyLevel === 'Khó').length,
    };
  }, [lessonQuestions]);

  // Tổng số câu hỏi Admin đang yêu cầu
  const totalRequested = (Number(easyCount) || 0) + (Number(mediumCount) || 0) + (Number(hardCount) || 0);

  // Cảnh báo nếu số lượng yêu cầu vượt quá kho
  const isOverEasy = (Number(easyCount) || 0) > inventoryStats.easy;
  const isOverMedium = (Number(mediumCount) || 0) > inventoryStats.medium;
  const isOverHard = (Number(hardCount) || 0) > inventoryStats.hard;
  const hasInventoryWarning = isOverEasy || isOverMedium || isOverHard;

  // --------------------------------------------------------------------------
  // Xử lý SINH ĐỀ NGẪU NHIÊN (Submit Cột trái)
  // --------------------------------------------------------------------------
  const handleGenerateTest = async (e) => {
    if (e) e.preventDefault();

    if (!selectedLessonId) {
      showToast('Vui lòng chọn bài học / đề thi trước khi sinh đề!', 'error');
      return;
    }

    if (totalRequested <= 0) {
      showToast('Vui lòng nhập ít nhất 1 câu hỏi để sinh đề!', 'error');
      return;
    }

    if (hasInventoryWarning) {
      showToast('Số lượng câu hỏi yêu cầu vượt quá số lượng hiện có trong kho!', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        lessonId: parseInt(selectedLessonId, 10),
        easyCount: Math.max(0, parseInt(easyCount, 10) || 0),
        mediumCount: Math.max(0, parseInt(mediumCount, 10) || 0),
        hardCount: Math.max(0, parseInt(hardCount, 10) || 0),
      };

      const result = await generateAutoTestApi(payload);

      if (result?.isSuccess) {
        const questionList = result.data || [];
        setGeneratedQuestions(questionList);
        setGeneratedMeta({
          lessonTitle: activeLesson?.title || 'Bài học',
          topicName: activeTopic?.name || '',
          gradeLevel: activeTopic?.gradeLevel || 1,
          total: result.total || questionList.length,
          easy: payload.easyCount,
          medium: payload.mediumCount,
          hard: payload.hardCount,
          createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        });

        showToast(`Đã sinh thành công ${questionList.length} câu hỏi ngẫu nhiên!`, 'success');
      } else {
        showToast(result?.message || 'Không thể sinh đề ngẫu nhiên!', 'error');
      }
    } catch (err) {
      console.error('Lỗi khi sinh đề tự động:', err);
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi tạo đề thi tự động!', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // --------------------------------------------------------------------------
  // Xử lý PHÁT HÀNH: Gửi đề bài cho Học sinh (Nút xanh Cột phải)
  // --------------------------------------------------------------------------
  const handlePublishTest = async () => {
    if (!selectedLessonId) {
      showToast('Vui lòng chọn bài học cần phát hành!', 'error');
      return;
    }

    setIsPublishing(true);
    try {
      const qIds = generatedQuestions && Array.isArray(generatedQuestions)
        ? generatedQuestions.map((q) => q.id)
        : null;

      const res = await publishTestApi({
        lessonId: parseInt(selectedLessonId, 10),
        questionIds: qIds
      });

      if (res?.isSuccess) {
        showToast(res.message || 'Thành công! Đề bài đã được gửi vào khóa học cho học sinh.', 'success');
        setGeneratedQuestions(null);
        setGeneratedMeta(null);
      } else {
        showToast(res?.message || 'Không thể phát hành đề thi!', 'error');
      }
    } catch (err) {
      console.error('Lỗi khi phát hành đề thi:', err);
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi phát hành đề thi!', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="autotest-wrapper">
      {/* 1. Header Trang */}
      <div className="autotest-top-header">
        <div className="autotest-top-title">
          <h1>Sinh Đề Tự Động</h1>
          <p>
            Cấu hình tỷ lệ câu hỏi ngẫu nhiên theo độ khó, rà soát đề thi và phát hành trực tiếp cho học sinh.
          </p>
        </div>
      </div>

      {/* 2. Bố cục 2 Cột Split-Screen Layout (Tỉ lệ 3.8 : 6.2) */}
      <div className="autotest-split-layout">
        {/* ==================================================================
            CỘT TRÁI: CẤU HÌNH SINH ĐỀ (Config Panel)
            ================================================================== */}
        <div className="config-column">
          <div className="config-card">
            <div className="card-header-bar">
              <div>
                <h2 className="card-header-title">Cấu hình Sinh đề</h2>
                <span className="card-header-sub">Thiết lập nguồn bài học & cơ cấu độ khó</span>
              </div>
            </div>

            <form onSubmit={handleGenerateTest} className="config-form">
              {/* 1. Chọn Chương mục khóa học */}
              <div className="form-field">
                <label htmlFor="topic-select">
                  <span>Chương mục khóa học *</span>
                  {isLoadingTopics && <span className="field-loading">Đang tải...</span>}
                </label>
                <select
                  id="topic-select"
                  className="custom-select"
                  value={selectedTopicId}
                  onChange={(e) => handleSelectTopic(e.target.value)}
                  disabled={isLoadingTopics || isGenerating}
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

              {/* 2. Chọn Bài học / Đề thi */}
              <div className="form-field">
                <label htmlFor="lesson-select">
                  <span>Bài học / Đề thi *</span>
                  {isLoadingLessons && <span className="field-loading">Đang nạp bài học...</span>}
                </label>
                <select
                  id="lesson-select"
                  className="custom-select"
                  value={selectedLessonId}
                  onChange={(e) => handleSelectLesson(e.target.value)}
                  disabled={isLoadingLessons || lessons.length === 0 || isGenerating}
                  required
                >
                  {lessons.length === 0 ? (
                    <option value="">-- Chương mục này chưa có bài học --</option>
                  ) : (
                    lessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        Bài {l.orderIndex}: {l.title} (ID: {l.id})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Thống kê kho câu hỏi hiện có trong bài học */}
              {selectedLessonId && (
                <div className="inventory-card">
                  <div className="inventory-header">
                    <span className="inventory-title">Kho câu hỏi của bài học này:</span>
                    <span className="inventory-total">{inventoryStats.total} câu</span>
                  </div>
                  <div className="inventory-chips">
                    <span className="inv-badge easy" title="Số câu dễ có trong ngân hàng">
                      Dễ: <strong>{inventoryStats.easy}</strong>
                    </span>
                    <span className="inv-badge medium" title="Số câu trung bình có trong ngân hàng">
                      Trung bình: <strong>{inventoryStats.medium}</strong>
                    </span>
                    <span className="inv-badge hard" title="Số câu khó có trong ngân hàng">
                      Khó: <strong>{inventoryStats.hard}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* 3. 3 ô Input dạng number để điền số lượng: Dễ, Trung bình, Khó */}
              <div className="difficulty-inputs-section">
                <label className="section-label">Số lượng câu hỏi theo độ khó:</label>

                {/* Câu Dễ */}
                <div className={`count-row ${isOverEasy ? 'has-error' : ''}`}>
                  <div className="count-info">
                    <span className="diff-pill easy">Dễ</span>
                    <span className="count-sub">Khả dụng: {inventoryStats.easy} câu</span>
                  </div>
                  <div className="count-control">
                    <button
                      type="button"
                      className="btn-step"
                      onClick={() => setEasyCount((prev) => Math.max(0, (parseInt(prev, 10) || 0) - 1))}
                      disabled={isGenerating || easyCount <= 0}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      max={inventoryStats.easy || 99}
                      className="count-number-input"
                      value={easyCount}
                      onChange={(e) => setEasyCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      disabled={isGenerating}
                    />
                    <button
                      type="button"
                      className="btn-step"
                      onClick={() => setEasyCount((prev) => (parseInt(prev, 10) || 0) + 1)}
                      disabled={isGenerating || (inventoryStats.easy > 0 && easyCount >= inventoryStats.easy)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Câu Trung bình */}
                <div className={`count-row ${isOverMedium ? 'has-error' : ''}`}>
                  <div className="count-info">
                    <span className="diff-pill medium">Trung bình</span>
                    <span className="count-sub">Khả dụng: {inventoryStats.medium} câu</span>
                  </div>
                  <div className="count-control">
                    <button
                      type="button"
                      className="btn-step"
                      onClick={() => setMediumCount((prev) => Math.max(0, (parseInt(prev, 10) || 0) - 1))}
                      disabled={isGenerating || mediumCount <= 0}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      max={inventoryStats.medium || 99}
                      className="count-number-input"
                      value={mediumCount}
                      onChange={(e) => setMediumCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      disabled={isGenerating}
                    />
                    <button
                      type="button"
                      className="btn-step"
                      onClick={() => setMediumCount((prev) => (parseInt(prev, 10) || 0) + 1)}
                      disabled={isGenerating || (inventoryStats.medium > 0 && mediumCount >= inventoryStats.medium)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Câu Khó */}
                <div className={`count-row ${isOverHard ? 'has-error' : ''}`}>
                  <div className="count-info">
                    <span className="diff-pill hard">Khó</span>
                    <span className="count-sub">Khả dụng: {inventoryStats.hard} câu</span>
                  </div>
                  <div className="count-control">
                    <button
                      type="button"
                      className="btn-step"
                      onClick={() => setHardCount((prev) => Math.max(0, (parseInt(prev, 10) || 0) - 1))}
                      disabled={isGenerating || hardCount <= 0}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      max={inventoryStats.hard || 99}
                      className="count-number-input"
                      value={hardCount}
                      onChange={(e) => setHardCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      disabled={isGenerating}
                    />
                    <button
                      type="button"
                      className="btn-step"
                      onClick={() => setHardCount((prev) => (parseInt(prev, 10) || 0) + 1)}
                      disabled={isGenerating || (inventoryStats.hard > 0 && hardCount >= inventoryStats.hard)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Cảnh báo thiếu hụt số lượng */}
                {hasInventoryWarning && (
                  <div className="alert-warning-box">
                    <strong>Lưu ý:</strong> Ngân hàng câu hỏi của bài học này không đủ số lượng theo yêu cầu. Hãy giảm số lượng hoặc bổ sung câu hỏi vào ngân hàng.
                  </div>
                )}

                {/* Tổng số câu dự kiến */}
                <div className="total-summary-card">
                  <span>Tổng số câu hỏi của đề thi:</span>
                  <strong className="total-number">{totalRequested} câu</strong>
                </div>
              </div>

              {/* Nút Sinh đề ngẫu nhiên */}
              <button
                type="submit"
                className="btn-generate-random"
                disabled={isGenerating || !selectedLessonId || totalRequested <= 0 || hasInventoryWarning}
              >
                {isGenerating ? (
                  <>
                    <span className="spinner-dot"></span> Đang bốc ngẫu nhiên...
                  </>
                ) : (
                  'Sinh đề ngẫu nhiên'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ==================================================================
            CỘT PHẢI: KHU VỰC XEM TRƯỚC & PHÁT HÀNH (Preview & Publish)
            (Khu vực này chỉ hiển thị danh sách khi đã sinh đề thành công)
            ================================================================== */}
        <div className="preview-column">
          {generatedQuestions && generatedQuestions.length > 0 ? (
            /* TRƯỜNG HỢP: ĐÃ SINH ĐỀ THÀNH CÔNG */
            <div className="preview-card">
              {/* Header: Hiển thị dòng chữ "Xem trước Đề thi" và tổng số câu hỏi */}
              <div className="preview-header">
                <div className="preview-header-main">
                  <div className="preview-badge-row">
                    <span className="badge-preview-tag">Xem trước đề thi</span>
                    <span className="badge-total-questions">
                      Tổng số: <strong>{generatedQuestions.length} câu hỏi</strong>
                    </span>
                  </div>
                  <h3 className="preview-lesson-title">
                    {generatedMeta?.lessonTitle || 'Đề thi tự động'}
                  </h3>
                  <div className="preview-meta-info">
                    <span>Khóa học: <strong>{generatedMeta?.topicName || 'Toán học'}</strong></span>
                    <span>• Lớp {generatedMeta?.gradeLevel}</span>
                    <span>• Sinh lúc: {generatedMeta?.createdAt}</span>
                  </div>
                </div>

                {/* Tóm tắt phân bổ độ khó */}
                <div className="preview-diff-distribution">
                  <span className="dist-chip easy">{generatedMeta?.easy} Dễ</span>
                  <span className="dist-chip medium">{generatedMeta?.medium} Trung bình</span>
                  <span className="dist-chip hard">{generatedMeta?.hard} Khó</span>
                </div>
              </div>

              {/* Danh sách Câu hỏi (Chỉ đọc - Read-only) */}
              <div className="preview-questions-scroll">
                <div className="readonly-banner">
                  <strong>Chế độ rà soát (Chỉ đọc):</strong> Admin vui lòng đối chiếu nội dung, phân loại và đáp án đúng trước khi chuyển giao cho học sinh.
                </div>

                <div className="preview-question-list">
                  {generatedQuestions.map((q, idx) => {
                    const isMultipleChoice = !q.questionType || q.questionType === 'Trắc nghiệm';
                    const hasOptions = Boolean(q.optionA || q.optionB || q.optionC || q.optionD);

                    return (
                      <div key={q.id || idx} className="preview-q-item">
                        {/* Header câu hỏi */}
                        <div className="q-item-header">
                          <span className="q-index-badge">Câu {idx + 1}</span>

                          <div className="q-header-tags">
                            {/* Tag Loại câu hỏi */}
                            {isMultipleChoice ? (
                              <span className="tag-qtype choice">Trắc nghiệm</span>
                            ) : (
                              <span className="tag-qtype fill">Điền đáp án</span>
                            )}

                            {/* Tag Độ khó */}
                            <span
                              className={`tag-difficulty ${
                                q.difficultyLevel === 'Dễ'
                                  ? 'easy'
                                  : q.difficultyLevel === 'Trung bình'
                                  ? 'medium'
                                  : 'hard'
                              }`}
                            >
                              {q.difficultyLevel}
                            </span>
                          </div>
                        </div>

                        {/* Nội dung câu hỏi (Chỉ đọc) */}
                        <div className="q-item-content">{q.content}</div>

                        {/* 4 Phương án lựa chọn nếu có (Trắc nghiệm) */}
                        {hasOptions && (
                          <div className="q-item-options-grid">
                            {q.optionA && (
                              <div
                                className={`q-opt-item ${
                                  q.correctAnswer === 'A' || q.correctAnswer === q.optionA ? 'is-correct-opt' : ''
                                }`}
                              >
                                <span className="opt-letter">A.</span>
                                <span className="opt-text">{q.optionA}</span>
                              </div>
                            )}
                            {q.optionB && (
                              <div
                                className={`q-opt-item ${
                                  q.correctAnswer === 'B' || q.correctAnswer === q.optionB ? 'is-correct-opt' : ''
                                }`}
                              >
                                <span className="opt-letter">B.</span>
                                <span className="opt-text">{q.optionB}</span>
                              </div>
                            )}
                            {q.optionC && (
                              <div
                                className={`q-opt-item ${
                                  q.correctAnswer === 'C' || q.correctAnswer === q.optionC ? 'is-correct-opt' : ''
                                }`}
                              >
                                <span className="opt-letter">C.</span>
                                <span className="opt-text">{q.optionC}</span>
                              </div>
                            )}
                            {q.optionD && (
                              <div
                                className={`q-opt-item ${
                                  q.correctAnswer === 'D' || q.correctAnswer === q.optionD ? 'is-correct-opt' : ''
                                }`}
                              >
                                <span className="opt-letter">D.</span>
                                <span className="opt-text">{q.optionD}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Đáp án đúng (Hiển thị rõ cho Admin rà soát, tuyệt đối không có input làm bài) */}
                        <div className="q-item-correct-box">
                          <span className="correct-title">Đáp án đúng:</span>
                          <span className="correct-answer-text">{q.correctAnswer}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer (Sticky): Nằm cố định dưới cùng, chứa nút "Gửi đề bài cho Học sinh" */}
              <div className="preview-sticky-footer">
                <div className="footer-left-meta">
                  <span className="footer-count">Đã rà soát: {generatedQuestions.length} câu</span>
                  <span className="footer-hint">Sẵn sàng xuất bản vào bài học</span>
                </div>
                <button
                  type="button"
                  className="btn-publish-test"
                  onClick={handlePublishTest}
                  disabled={isPublishing}
                >
                  {isPublishing ? 'Đang gửi đề bài...' : 'Gửi đề bài cho học sinh'}
                </button>
              </div>
            </div>
          ) : (
            /* TRƯỜNG HỢP: CHƯA BẤM SINH ĐỀ */
            <div className="preview-empty-card">
              <h3 className="empty-title">Khu vực Xem trước & Phát hành Đề thi</h3>
              <p className="empty-desc">
                Chọn chương mục, bài học và cơ cấu số lượng ở <strong>Cột Cấu hình bên trái</strong>, sau đó bấm nút <strong>"Sinh đề ngẫu nhiên"</strong>.
              </p>
              <div className="empty-steps-guide">
                <div className="guide-step">
                  <span className="step-num">1</span>
                  <span>Chọn Chương mục & Bài học</span>
                </div>
                <div className="guide-step">
                  <span className="step-num">2</span>
                  <span>Phân bổ số lượng Dễ, Vừa, Khó</span>
                </div>
                <div className="guide-step">
                  <span className="step-num">3</span>
                  <span>Xem trước danh sách câu hỏi chỉ đọc</span>
                </div>
                <div className="guide-step">
                  <span className="step-num">4</span>
                  <span>Bấm "Gửi đề bài" để phát hành cho Học sinh</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Toast Thông báo */}
      {toast.show && (
        <div className={`autotest-toast ${toast.type}`}>
          <span className="toast-text">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default AutoTestGenerator;

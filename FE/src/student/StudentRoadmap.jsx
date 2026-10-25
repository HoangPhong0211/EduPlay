import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import './StudentRoadmap.css';

export default function StudentRoadmap() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGrade = parseInt(searchParams.get('grade') || '1', 10);

  const [selectedGrade, setSelectedGrade] = useState(
    [1, 2, 3, 4, 5].includes(initialGrade) ? initialGrade : 1
  );
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Tải lộ trình từ backend theo khối lớp
  const fetchRoadmap = async (grade) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await axiosClient.get(`/student/roadmap/${grade}`);
      if (res.data?.isSuccess && Array.isArray(res.data.data)) {
        setTopics(res.data.data);
      } else {
        setTopics([]);
      }
    } catch (err) {
      console.error('Lỗi khi tải lộ trình:', err);
      setErrorMsg('Không thể tải lộ trình học tập. Vui lòng thử lại sau.');
      setTopics([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap(selectedGrade);
    setSearchParams({ grade: selectedGrade.toString() });
  }, [selectedGrade]);

  const handleSelectGrade = (grade) => {
    setSelectedGrade(grade);
  };

  // Lọc bài học theo từ khóa tìm kiếm
  const filteredTopics = topics.filter((t) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchTopic = t.topicName.toLowerCase().includes(query);
    const matchLesson = t.lessons?.some((l) => l.title.toLowerCase().includes(query));
    return matchTopic || matchLesson;
  });

  const totalLessons = topics.reduce((acc, t) => acc + (t.lessons?.length || 0), 0);

  return (
    <div className="student-roadmap-page">
      {/* Header Lộ Trình */}
      <section className="roadmap-header-card">
        <div className="roadmap-header-info">
          <span className="roadmap-badge">KHÁM PHÁ KIẾN THỨC</span>
          <h1 className="roadmap-title">Lộ trình học Toán Tiểu học</h1>
          <p className="roadmap-desc">
            Chương trình được thiết kế chuẩn sư phạm từ Lớp 1 đến Lớp 5 (toàn cấp Tiểu học), giúp bé làm chủ từng khái niệm toán học qua hệ thống bài học và câu hỏi tương tác.
          </p>
        </div>

        {/* Thanh chuyển đổi Khối Lớp */}
        <div className="grade-selector-tabs">
          {[1, 2, 3, 4, 5].map((g) => (
            <button
              key={g}
              onClick={() => handleSelectGrade(g)}
              className={`grade-tab-btn ${selectedGrade === g ? 'active' : ''}`}
            >
              <span className="tab-grade-label">Toán</span>
              <span className="tab-grade-num">Lớp {g}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Thanh Công Cụ & Thống Kê */}
      <div className="roadmap-toolbar">
        <div className="toolbar-stats">
          <span className="stats-pill">
            Khối Lớp {selectedGrade}: <strong>{topics.length}</strong> Chủ đề • <strong>{totalLessons}</strong> Bài học
          </span>
        </div>
        <div className="toolbar-search">
          <input
            type="text"
            placeholder="Tìm kiếm bài học hoặc chủ đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="search-clear-btn">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Thông báo lỗi */}
      {errorMsg && (
        <div className="roadmap-error-alert">{errorMsg}</div>
      )}

      {/* Trạng thái Loading */}
      {isLoading ? (
        <div className="roadmap-loading-box">
          <div className="loading-spinner"></div>
          <p>Đang tải lộ trình học tập Khối Lớp {selectedGrade}...</p>
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="roadmap-empty-box">
          <span className="empty-icon">📖</span>
          <h3>Không tìm thấy chủ đề nào</h3>
          <p>
            {searchQuery
              ? `Không có bài học nào khớp với từ khóa "${searchQuery}".`
              : `Hiện chưa có dữ liệu bài học cho Khối Lớp ${selectedGrade}.`}
          </p>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="btn-reset-search">
              Xóa tìm kiếm
            </button>
          )}
        </div>
      ) : (
        /* Danh sách Chủ Đề & Bài Học */
        <div className="topics-stream-list">
          {filteredTopics.map((topic, topicIdx) => (
            <div key={topic.topicId} className="topic-stream-card">
              {/* Header của Topic */}
              <div className="topic-card-header">
                <div className="topic-index-badge">Chủ đề {topicIdx + 1}</div>
                <div className="topic-meta-info">
                  <h2 className="topic-title">{topic.topicName}</h2>
                  {topic.description && (
                    <p className="topic-description">{topic.description}</p>
                  )}
                </div>
                <div className="topic-lessons-count">
                  {topic.lessons?.length || 0} bài học
                </div>
              </div>

              {/* Danh sách các Bài Học trực thuộc */}
              <div className="topic-lessons-grid">
                {(topic.lessons || []).map((lesson, lIdx) => (
                  <div key={lesson.lessonId} className="lesson-action-item">
                    <div className="lesson-seq-box">
                      <span className="lesson-seq-num">{lIdx + 1}</span>
                    </div>
                    <div className="lesson-details">
                      <h3 className="lesson-title">{lesson.title}</h3>
                      <span className="lesson-sub-meta">Thứ tự: #{lesson.orderIndex}</span>
                    </div>
                    <Link
                      to={`/student/practice/${lesson.lessonId}`}
                      className="btn-start-lesson"
                    >
                      Luyện tập →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

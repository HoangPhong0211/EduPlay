import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import './CompetencyReport.css';

export default function CompetencyReport() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [report, setReport] = useState(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Tải danh sách con để phụ huynh chọn
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoadingStudents(true);
      try {
        const response = await axiosClient.get('/parent/students');
        if (Array.isArray(response.data) && response.data.length > 0) {
          setStudents(response.data);

          // Kiểm tra xem URL có truyền ?studentId không
          const paramId = searchParams.get('studentId');
          const matchingChild = response.data.find(
            (s) => String(s.studentId) === String(paramId)
          );

          if (matchingChild) {
            setSelectedStudentId(String(matchingChild.studentId));
          } else {
            setSelectedStudentId(String(response.data[0].studentId));
          }
        } else {
          setStudents([]);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách con:', err);
        setErrorMsg('Không thể tải danh sách tài khoản của con.');
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudents();
  }, []);

  // 2. Tải báo cáo năng lực khi đổi con
  useEffect(() => {
    if (!selectedStudentId) {
      setReport(null);
      return;
    }

    const fetchReport = async () => {
      setIsLoadingReport(true);
      setErrorMsg('');
      try {
        const response = await axiosClient.get(`/parent/report/${selectedStudentId}`);
        setReport(response.data);
      } catch (err) {
        console.error('Lỗi khi tải báo cáo năng lực:', err);
        if (err.response && err.response.status === 403) {
          setErrorMsg('Bạn không có quyền xem báo cáo của học sinh này.');
        } else {
          setErrorMsg('Không thể lấy báo cáo năng lực. Vui lòng thử lại sau.');
        }
        setReport(null);
      } finally {
        setIsLoadingReport(false);
      }
    };

    fetchReport();
    // Đồng bộ URL parameter
    setSearchParams({ studentId: selectedStudentId }, { replace: true });
  }, [selectedStudentId]);

  const selectedChild = students.find((s) => String(s.studentId) === String(selectedStudentId));

  // Đánh giá mức độ thành thạo và khuyến nghị sư phạm
  const getCompetencyEvaluation = (accuracy, attempts) => {
    if (attempts === 0) {
      return {
        rating: 'Chưa có dữ liệu',
        badgeClass: 'neutral',
        comment: 'Bé chưa tham gia làm câu hỏi nào trên hệ thống. Ba mẹ hãy khuyến khích bé làm các bài tập đầu tiên nhé!',
      };
    }
    if (accuracy >= 85) {
      return {
        rating: 'Năng lực xuất sắc',
        badgeClass: 'excellent',
        comment: 'Bé nắm vững kiến thức bài học rất tốt! Ba mẹ có thể giao thêm các bài tập có độ khó cao hơn để nâng cao tư duy.',
      };
    }
    if (accuracy >= 70) {
      return {
        rating: 'Năng lực Khá - Tốt',
        badgeClass: 'good',
        comment: 'Bé tiếp thu bài nhanh và giải đúng phần lớn câu hỏi. Cần rà soát các câu sai để khắc phục những điểm nhầm lẫn nhỏ.',
      };
    }
    if (accuracy >= 50) {
      return {
        rating: 'Cần củng cố thêm',
        badgeClass: 'average',
        comment: 'Bé đang trong quá trình nắm bắt kiến thức. Ba mẹ nên cùng bé xem qua phần Gợi ý từ AI bên dưới để giúp con hiểu sâu hơn.',
      };
    }
    return {
      rating: 'Cần hỗ trợ tích cực',
      badgeClass: 'warning',
      comment: 'Bé gặp nhiều khó khăn ở các dạng bài vừa làm. Ba mẹ hãy giảm thời lượng học mỗi buổi, kiên nhẫn hướng dẫn theo gợi ý của AI.',
    };
  };

  const evaluation = report ? getCompetencyEvaluation(report.accuracyRate, report.totalAttempts) : null;

  return (
    <div className="report-page">
      {/* 1. Header Section */}
      <div className="report-header-card">
        <div className="report-header-info">
          <h1>Báo Cáo Năng Lực Của Con</h1>
          <p>
            Phân tích tỷ lệ làm đúng, phát hiện các dạng bài con còn vướng và gợi ý phương pháp sư phạm từ AI.
          </p>
        </div>

        {/* Bộ chọn con */}
        <div className="report-child-selector">
          <label htmlFor="select-child-report">Chọn con theo dõi:</label>
          <select
            id="select-child-report"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            disabled={isLoadingStudents || students.length === 0}
          >
            {students.length === 0 ? (
              <option value="">-- Chưa có hồ sơ con --</option>
            ) : (
              students.map((s) => (
                <option key={s.studentId} value={s.studentId}>
                  {s.nickname} (@{s.username})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {errorMsg && (
        <div className="report-alert-error">
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoadingStudents ? (
        <div className="report-loading-card">Đang chuẩn bị hồ sơ học sinh...</div>
      ) : students.length === 0 ? (
        <div className="report-empty-card">
          <h3>Chưa có hồ sơ học sinh nào</h3>
          <p>Ba mẹ cần tạo tài khoản cho con trước khi có thể xem báo cáo năng lực học tập.</p>
          <Link to="/parent/children" className="btn-primary">
            Đến trang quản lý hồ sơ con
          </Link>
        </div>
      ) : isLoadingReport ? (
        <div className="report-loading-card">Đang phân tích dữ liệu làm bài của con...</div>
      ) : report ? (
        <div className="report-content-flow">
          {/* 2. Thẻ Thống Kê Tổng Quan */}
          <div className="report-stats-grid">
            <div className="stat-card">
              <div className="stat-details">
                <span className="stat-label">Tổng số lượt làm bài</span>
                <h3 className="stat-value">{report.totalAttempts} câu</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-details">
                <span className="stat-label">Số câu trả lời đúng</span>
                <h3 className="stat-value">{report.correctAnswers} câu</h3>
              </div>
            </div>

            <div className="stat-card highlight">
              <div className="stat-details">
                <span className="stat-label">Tỷ lệ chính xác</span>
                <h3 className="stat-value">{report.accuracyRate}%</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-details">
                <span className="stat-label">Đánh giá năng lực</span>
                <span className={`eval-badge ${evaluation.badgeClass}`}>
                  {evaluation.rating}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Thanh Tiến Độ & Lời Khuyên Sư Phạm Cho Phụ Huynh */}
          <div className="advice-card">
            <div className="progress-section">
              <div className="progress-header">
                <span className="progress-title">Mức độ hoàn thành mục tiêu:</span>
                <span className="progress-percent">{report.accuracyRate}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, report.accuracyRate))}%`,
                    backgroundColor:
                      report.accuracyRate >= 80
                        ? '#16a34a'
                        : report.accuracyRate >= 60
                        ? '#2563eb'
                        : report.accuracyRate >= 40
                        ? '#f59e0b'
                        : '#ef4444',
                  }}
                ></div>
              </div>
            </div>

            <div className="parent-advice-box">
              <span className="advice-tag">Nhận xét & Hướng dẫn dành cho ba mẹ:</span>
              <p className="advice-text">{evaluation.comment}</p>
            </div>
          </div>

          {/* 4. Danh Sách 5 Câu Làm Sai Gần Đây & Gợi Ý AI */}
          <div className="mistakes-section">
            <div className="mistakes-header">
              <div>
                <h2 className="section-title">Các câu hỏi con làm sai gần đây</h2>
                <p className="section-subtitle">
                  Đối chiếu đáp án con đã chọn và đọc phần Gợi ý từ AI để đồng hành hướng dẫn con sửa sai.
                </p>
              </div>
              <span className="mistakes-count-badge">
                {report.recentMistakes.length} câu cần lưu ý
              </span>
            </div>

            {report.recentMistakes.length === 0 ? (
              <div className="mistakes-empty-card">
                <h3>Tuyệt vời! Con không có câu làm sai nào gần đây</h3>
                <p>
                  Tất cả các câu bé vừa làm đều đạt kết quả chính xác, hoặc bé chưa có lịch sử làm sai câu nào.
                </p>
              </div>
            ) : (
              <div className="mistakes-list">
                {report.recentMistakes.map((item, idx) => {
                  const attemptTimeStr = item.attemptTime
                    ? new Date(item.attemptTime).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : 'Gần đây';

                  return (
                    <div key={idx} className="mistake-item-card">
                      <div className="mistake-item-header">
                        <span className="mistake-num">Câu sai #{idx + 1}</span>
                        <span className="mistake-time">{attemptTimeStr}</span>
                      </div>

                      {/* Nội dung câu hỏi */}
                      <div className="mistake-question-content">
                        {item.questionContent}
                      </div>

                      {/* Đáp án con đã nộp */}
                      <div className="mistake-submitted-row">
                        <span className="submitted-label">Đáp án con đã nộp:</span>
                        <span className="submitted-val-pill">
                          {item.submittedAnswer || 'Chưa có câu trả lời'}
                        </span>
                      </div>

                      {/* Khung Gợi ý AI (AI Hint Callout) */}
                      <div className="ai-hint-callout">
                        <div className="ai-hint-header">
                          <span className="ai-hint-label">Gợi ý phân tích từ AI:</span>
                        </div>
                        <div className="ai-hint-body">
                          {item.hint && item.hint.trim() !== '' ? (
                            item.hint
                          ) : (
                            <span className="hint-not-available">
                              Chưa có gợi ý AI được lưu cho câu hỏi này. Ba mẹ hãy khuyến khích con đọc lại đề bài thật kỹ nhé.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import './StudentPractice.css';

export default function StudentPractice() {
  const { lessonId } = useParams();
  const { refreshStudentInfo } = useOutletContext();

  const [lessonInfo, setLessonInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Trạng thái trả lời của câu hiện tại
  const [selectedOption, setSelectedOption] = useState('');
  const [inputAnswer, setInputAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultFeedback, setResultFeedback] = useState(null); // { isCorrect, message }
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);

  // Thống kê kết quả phiên học
  const [sessionStats, setSessionStats] = useState({
    correctCount: 0,
    wrongCount: 0,
    pointsEarned: 0,
  });
  const [isCompletedSession, setIsCompletedSession] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Tải danh sách câu hỏi của bài học
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const res = await axiosClient.get(`/student/lesson/${lessonId}/questions`);
        if (res.data?.isSuccess) {
          setLessonInfo(res.data.lesson || null);
          const list = Array.isArray(res.data.data) ? res.data.data : [];
          setQuestions(list);
        } else {
          setErrorMsg(res.data?.message || 'Không thể tải câu hỏi bài học.');
        }
      } catch (err) {
        console.error('Lỗi khi tải câu hỏi bài học:', err);
        setErrorMsg('Không thể kết nối đến máy chủ để tải bài học.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [lessonId]);

  const currentQuestion = questions[currentIndex];

  // Reset form khi chuyển câu
  const resetQuestionState = () => {
    setSelectedOption('');
    setInputAnswer('');
    setResultFeedback(null);
    setHasAnsweredCurrent(false);
  };

  // Nộp câu trả lời
  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;

    const answer =
      currentQuestion.questionType === 'Trắc nghiệm'
        ? selectedOption
        : inputAnswer.trim();

    if (!answer) {
      alert('Vui lòng chọn hoặc nhập đáp án trước khi nộp bài!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosClient.post('/student/submit-answer', {
        questionId: currentQuestion.id,
        submittedAnswer: answer,
      });

      const message = res.data?.message || '';
      const isCorrect = message.includes('Chính xác');

      setResultFeedback({
        isCorrect,
        message,
      });
      setHasAnsweredCurrent(true);

      // Cập nhật thống kê phiên học
      const points =
        currentQuestion.difficultyLevel === 'Dễ'
          ? 5
          : currentQuestion.difficultyLevel === 'Khó'
          ? 20
          : 10;

      if (isCorrect) {
        setSessionStats((prev) => ({
          ...prev,
          correctCount: prev.correctCount + 1,
          pointsEarned: prev.pointsEarned + points,
        }));
      } else {
        setSessionStats((prev) => ({
          ...prev,
          wrongCount: prev.wrongCount + 1,
        }));
      }

      // Làm mới thông tin điểm thưởng ở Header
      if (refreshStudentInfo) {
        refreshStudentInfo();
      }
    } catch (err) {
      console.error('Lỗi khi nộp bài:', err);
      alert('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chuyển sang câu tiếp theo hoặc hoàn thành
  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      resetQuestionState();
    } else {
      setIsCompletedSession(true);
    }
  };

  // Thử lại câu hiện tại nếu làm sai
  const handleRetryCurrent = () => {
    setSelectedOption('');
    setInputAnswer('');
    setResultFeedback(null);
    setHasAnsweredCurrent(false);
  };

  // Làm lại từ đầu phiên học
  const handleRestartSession = () => {
    setCurrentIndex(0);
    resetQuestionState();
    setSessionStats({ correctCount: 0, wrongCount: 0, pointsEarned: 0 });
    setIsCompletedSession(false);
  };

  // Bấm số trên bàn phím ảo (hỗ trợ nhập nhanh trên tablet/chuột)
  const handleVirtualKey = (val) => {
    if (hasAnsweredCurrent) return;
    if (val === 'backspace') {
      setInputAnswer((prev) => prev.slice(0, -1));
    } else if (val === 'clear') {
      setInputAnswer('');
    } else {
      setInputAnswer((prev) => prev + val);
    }
  };

  if (isLoading) {
    return (
      <div className="practice-loading-container">
        <div className="practice-spinner"></div>
        <p>Đang chuẩn bị bài học và các câu hỏi cho bạn...</p>
      </div>
    );
  }

  if (errorMsg || questions.length === 0) {
    return (
      <div className="practice-error-container">
        <span className="error-icon">📚</span>
        <h2 className="error-title">
          {errorMsg || 'Chưa có câu hỏi nào cho bài học này'}
        </h2>
        <p className="error-desc">
          Thầy cô hoặc quản trị viên đang cập nhật ngân hàng câu hỏi. Bạn hãy quay lại sau hoặc thử các bài học khác nhé!
        </p>
        <Link to="/student/roadmap" className="btn-back-roadmap">
          ← Quay về Lộ trình học
        </Link>
      </div>
    );
  }

  // Màn hình tổng kết khi hoàn thành tất cả các câu
  if (isCompletedSession) {
    return (
      <div className="practice-summary-card">
        <div className="summary-badge">HOÀN THÀNH BÀI LUYỆN TẬP</div>
        <h1 className="summary-title">Chúc mừng bạn đã hoàn thành bài học!</h1>
        <p className="summary-lesson-name">{lessonInfo?.title}</p>

        <div className="summary-stats-grid">
          <div className="summary-stat-box point-stat">
            <span className="summary-stat-val">+{sessionStats.pointsEarned}</span>
            <span className="summary-stat-lbl">Điểm thưởng tích lũy</span>
          </div>
          <div className="summary-stat-box correct-stat">
            <span className="summary-stat-val">
              {sessionStats.correctCount}/{questions.length}
            </span>
            <span className="summary-stat-lbl">Câu trả lời đúng</span>
          </div>
          <div className="summary-stat-box wrong-stat">
            <span className="summary-stat-val">{sessionStats.wrongCount}</span>
            <span className="summary-stat-lbl">Câu cần rèn luyện thêm</span>
          </div>
        </div>

        <div className="summary-actions-row">
          <button onClick={handleRestartSession} className="btn-retry-session">
            Luyện tập lại
          </button>
          <Link to="/student/roadmap" className="btn-primary-finish">
            Tiếp tục Lộ trình học →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="student-practice-page">
      {/* Header thanh trạng thái bài học */}
      <div className="practice-top-bar">
        <div className="top-bar-left">
          <Link to="/student/roadmap" className="back-link">
            ← Lộ trình
          </Link>
          <div className="lesson-breadcrumb">
            <span className="topic-name-crumb">{lessonInfo?.topicName || 'Toán học'}</span>
            <span className="divider">/</span>
            <span className="lesson-name-crumb">{lessonInfo?.title || 'Luyện tập'}</span>
          </div>
        </div>

        {/* Tiến độ câu hỏi */}
        <div className="progress-indicator">
          <span>
            Câu <strong>{currentIndex + 1}</strong> / {questions.length}
          </span>
          <div className="progress-mini-bar">
            <div
              className="progress-mini-fill"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Thẻ Câu Hỏi Chính */}
      <div className="question-play-card">
        {/* Meta câu hỏi: Loại câu & Độ khó */}
        <div className="question-header-meta">
          <span className="question-type-chip">
            {currentQuestion.questionType || 'Trắc nghiệm'}
          </span>
          <span
            className={`difficulty-chip difficulty-${(
              currentQuestion.difficultyLevel || 'Trung bình'
            ).toLowerCase()}`}
          >
            Độ khó: {currentQuestion.difficultyLevel || 'Trung bình'} (
            {currentQuestion.difficultyLevel === 'Dễ'
              ? '+5đ'
              : currentQuestion.difficultyLevel === 'Khó'
              ? '+20đ'
              : '+10đ'}
            )
          </span>
        </div>

        {/* Nội dung câu hỏi */}
        <div className="question-body-content">
          <p className="question-text">{currentQuestion.content}</p>
        </div>

        {/* Khu vực Nhập Đáp Án theo dạng câu hỏi */}
        <div className="answer-interaction-area">
          {currentQuestion.questionType === 'Trắc nghiệm' ? (
            /* Dạng Trắc Nghiệm: 4 Ô Lựa Chọn */
            <div className="mcq-options-grid">
              {[
                { label: 'A', text: currentQuestion.optionA },
                { label: 'B', text: currentQuestion.optionB },
                { label: 'C', text: currentQuestion.optionC },
                { label: 'D', text: currentQuestion.optionD },
              ]
                .filter((opt) => opt.text && opt.text.trim() !== '')
                .map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    disabled={hasAnsweredCurrent}
                    onClick={() => setSelectedOption(opt.text)}
                    className={`mcq-option-btn ${
                      selectedOption === opt.text ? 'selected' : ''
                    }`}
                  >
                    <span className="opt-label">{opt.label}</span>
                    <span className="opt-text">{opt.text}</span>
                  </button>
                ))}
            </div>
          ) : (
            /* Dạng Điền Đáp Án: Ô Nhập & Bàn Phím Số Ảo */
            <div className="fill-answer-wrap">
              <div className="fill-input-group">
                <input
                  type="text"
                  placeholder="Gõ đáp án của bạn vào đây..."
                  value={inputAnswer}
                  disabled={hasAnsweredCurrent}
                  onChange={(e) => setInputAnswer(e.target.value)}
                  className="fill-answer-input"
                  autoFocus
                />
              </div>

              {/* Bàn phím số tương tác */}
              {!hasAnsweredCurrent && (
                <div className="virtual-numpad">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleVirtualKey(num.toString())}
                      className="numpad-key"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleVirtualKey('backspace')}
                    className="numpad-key key-del"
                  >
                    ⌫ Xóa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVirtualKey('clear')}
                    className="numpad-key key-clear"
                  >
                    C
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hộp Thông Báo Phản Hồi Sau Khi Nộp Bài */}
        {resultFeedback && (
          <div
            className={`result-feedback-box ${
              resultFeedback.isCorrect ? 'feedback-correct' : 'feedback-wrong'
            }`}
          >
            <div className="feedback-icon">
              {resultFeedback.isCorrect ? '🎉' : '💡'}
            </div>
            <div className="feedback-content">
              <h4 className="feedback-title">
                {resultFeedback.isCorrect ? 'Chính xác! Xuất sắc lắm!' : 'Chưa chính xác rồi!'}
              </h4>
              <p className="feedback-message">{resultFeedback.message}</p>
            </div>
          </div>
        )}

        {/* Nút Thao Tác: Nộp bài hoặc Chuyển tiếp */}
        <div className="question-actions-bar">
          {!hasAnsweredCurrent ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={
                isSubmitting ||
                (currentQuestion.questionType === 'Trắc nghiệm'
                  ? !selectedOption
                  : !inputAnswer.trim())
              }
              className="btn-submit-answer"
            >
              {isSubmitting ? 'Đang chấm điểm...' : 'Kiểm tra đáp án'}
            </button>
          ) : (
            <div className="post-answer-buttons">
              {!resultFeedback?.isCorrect && (
                <button onClick={handleRetryCurrent} className="btn-retry-question">
                  Thử lại câu này
                </button>
              )}
              <button onClick={handleNextQuestion} className="btn-next-question">
                {currentIndex + 1 < questions.length
                  ? 'Câu tiếp theo →'
                  : 'Xem kết quả bài học →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

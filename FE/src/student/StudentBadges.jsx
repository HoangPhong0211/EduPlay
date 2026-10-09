import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import './StudentBadges.css';

export default function StudentBadges() {
  const { studentInfo } = useOutletContext();
  const [dashboardData, setDashboardData] = useState({
    totalPoints: studentInfo?.totalPoints || 0,
    earnedBadges: studentInfo?.earnedBadges || [],
    nickname: studentInfo?.nickname || 'Bạn nhỏ',
  });

  // Tải dữ liệu dashboard mới nhất (chạy 1 lần khi vào trang)
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const res = await axiosClient.get('/student/dashboard');
        if (isMounted && res.data?.isSuccess && res.data.data) {
          setDashboardData(res.data.data);
        }
      } catch (err) {
        console.warn('Lỗi khi tải thông tin huy hiệu:', err);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Danh mục tất cả các huy hiệu trong hệ thống EduPlay
  const allBadgesCatalog = [
    {
      id: 'cham-chi',
      name: 'Chăm chỉ',
      requiredPoints: 50,
      icon: '★',
      desc: 'Dành tặng bạn nhỏ kiên trì học tập và vượt qua các thử thách toán học đầu tiên.',
      rewardTitle: 'Học sinh kiên trì',
    },
    {
      id: 'thong-minh',
      name: 'Thông minh',
      requiredPoints: 100,
      icon: '✦',
      desc: 'Xuất sắc chinh phục các bài toán khó và đạt mốc 100 điểm thưởng danh giá.',
      rewardTitle: 'Nhà toán học nhí',
    },
    {
      id: 'chien-binh',
      name: 'Chiến binh Toán học',
      requiredPoints: 200,
      icon: '❖',
      desc: 'Chinh phục toàn diện các dạng bài tập, duy trì phong độ giải toán xuất sắc.',
      rewardTitle: 'Chiến binh dũng cảm',
    },
    {
      id: 'bac-thay',
      name: 'Bậc thầy Khám phá',
      requiredPoints: 300,
      icon: '👑',
      desc: 'Đỉnh cao tri thức toán học tiểu học, làm chủ mọi kỹ năng và tư duy logic.',
      rewardTitle: 'Bậc thầy EduPlay',
    },
  ];

  const earnedBadgeNames = dashboardData.earnedBadges || [];
  const currentPoints = dashboardData.totalPoints || 0;

  return (
    <div className="student-badges-page">
      {/* Header Card */}
      <section className="badges-header-card">
        <div className="badges-header-info">
          <span className="badges-tag">BỘ SƯU TẬP HUY HIỆU</span>
          <h1 className="badges-title">Phòng Truyền Thống Của Bạn</h1>
          <p className="badges-desc">
            Mỗi huy hiệu là một minh chứng cho sự nỗ lực và tài năng toán học của bạn. Hãy tích cực giải bài tập để mở khóa toàn bộ các huy hiệu danh giá nhé!
          </p>
        </div>

        {/* Tổng kết điểm & Huy hiệu */}
        <div className="badges-header-stats">
          <div className="badge-stat-box">
            <span className="badge-stat-val">★ {currentPoints}</span>
            <span className="badge-stat-lbl">Tổng điểm thưởng</span>
          </div>
          <div className="badge-stat-box">
            <span className="badge-stat-val">
              {earnedBadgeNames.length}/{allBadgesCatalog.length}
            </span>
            <span className="badge-stat-lbl">Huy hiệu đã đạt</span>
          </div>
        </div>
      </section>

      {/* Danh sách Huy Hiệu */}
      <section className="badges-catalog-section">
        <div className="section-title-wrap">
          <h2 className="section-heading">Danh mục Huy hiệu EduPlay</h2>
          <span className="section-sub">
            Hoàn thành bài tập để nhận điểm thưởng và tự động nhận huy hiệu
          </span>
        </div>

        <div className="badges-grid">
          {allBadgesCatalog.map((badge) => {
            const isEarned = earnedBadgeNames.includes(badge.name);
            const progress = Math.min(100, Math.round((currentPoints / badge.requiredPoints) * 100));
            const pointsNeeded = Math.max(0, badge.requiredPoints - currentPoints);

            return (
              <div
                key={badge.id}
                className={`badge-card ${isEarned ? 'badge-card-unlocked' : 'badge-card-locked'}`}
              >
                {/* Biểu tượng Huy Hiệu */}
                <div className="badge-icon-bubble">
                  <span className="badge-icon-symbol">{badge.icon}</span>
                  {!isEarned && <span className="badge-lock-tag">🔒</span>}
                </div>

                <div className="badge-info-wrap">
                  <div className="badge-card-top">
                    <span className="badge-reward-title">{badge.rewardTitle}</span>
                    <span
                      className={`badge-status-pill ${
                        isEarned ? 'status-unlocked' : 'status-locked'
                      }`}
                    >
                      {isEarned ? '✓ Đã nhận' : `Cần ${badge.requiredPoints}đ`}
                    </span>
                  </div>

                  <h3 className="badge-name">Huy hiệu "{badge.name}"</h3>
                  <p className="badge-desc">{badge.desc}</p>

                  {/* Thanh tiến độ điểm */}
                  {!isEarned ? (
                    <div className="badge-progress-wrap">
                      <div className="badge-progress-labels">
                        <span>Tiến độ: {currentPoints}/{badge.requiredPoints} điểm</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="badge-progress-bg">
                        <div
                          className="badge-progress-fill"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="points-needed-hint">
                        Cần thêm {pointsNeeded} điểm nữa để mở khóa!
                      </span>
                    </div>
                  ) : (
                    <div className="badge-achieved-note">
                      <span>🎉 Đã mở khóa thành công trong bộ sưu tập</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Thẻ Kêu Gọi Luyện Tập */}
      <section className="badges-cta-card">
        <div className="cta-content">
          <h3 className="cta-title">Muốn mở khóa thêm nhiều huy hiệu?</h3>
          <p className="cta-desc">
            Vào ngay phần Lộ trình học tập hoặc làm các bài tập được bố mẹ giao để kiếm từ 5 đến 20 điểm cho mỗi câu trả lời chính xác!
          </p>
        </div>
        <Link to="/student/roadmap" className="btn-cta-roadmap">
          Bắt đầu luyện tập ngay →
        </Link>
      </section>
    </div>
  );
}

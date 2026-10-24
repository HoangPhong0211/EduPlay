import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import './Auth.css';

// Trích xuất thông báo lỗi chính xác từ response của Backend
function extractErrorMessage(error) {
  if (!error.response) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại Backend.';
  }
  const data = error.response.data;
  if (typeof data === 'string') return data;
  if (data?.message) return data.message;
  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ');
  }
  if (data?.title) return data.title;
  return 'Có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại!';
}

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Nhập Username nhận OTP, 2: Nhập OTP & Đặt lại mật khẩu
  const [username, setUsername] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Giả lập gửi nhận email trong môi trường cá nhân / Localhost
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [simulatedEmail, setSimulatedEmail] = useState({
    to: '',
    from: 'no-reply@eduplay.vn',
    subject: '[EduPlay] Mã OTP khôi phục mật khẩu',
    otp: '',
    time: '',
  });
  const [isCopied, setIsCopied] = useState(false);

  const navigate = useNavigate();

  // Bước 1: Gửi yêu cầu sinh mã OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setErrorMsg('Vui lòng nhập tên đăng nhập của bạn.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axiosClient.post('/auth/forgot-password', {
        Username: trimmedUser,
      });

      const message = res.data?.message || 'Mã OTP đã được gửi thành công.';
      setSuccessMsg(message);

      // Trích xuất email người nhận
      let recipientEmail = '';
      const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch && emailMatch[1]) {
        recipientEmail = emailMatch[1].trim();
      }

      // Trích xuất mã OTP 6 số nếu Backend trả về (chế độ mô phỏng dev)
      let extractedOtp = '';
      const otpMatch = message.match(/\b\d{6}\b/);
      if (otpMatch) {
        extractedOtp = otpMatch[0];
        setOtpCode(extractedOtp);
      }

      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} ngày ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

      setSimulatedEmail({
        to: recipientEmail || `${trimmedUser}@gmail.com`,
        from: 'no-reply@eduplay.vn',
        subject: '[EduPlay] Mã OTP khôi phục mật khẩu tài khoản',
        otp: extractedOtp,
        time: timeString,
      });

      // CHỈ mở cửa sổ hộp thư giả lập nếu có mã OTP trả về (chế độ mô phỏng dev)
      // Nếu gửi email thật thành công qua SMTP, KHÔNG mở hộp thư giả lập bị rỗng
      if (extractedOtp) {
        setShowEmailModal(true);
      } else {
        setShowEmailModal(false);
      }

      // Chuyển sang Bước 2
      setStep(2);
    } catch (err) {
      setErrorMsg(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Sao chép mã OTP vào Clipboard
  const handleCopyOtp = () => {
    if (simulatedEmail.otp) {
      navigator.clipboard.writeText(simulatedEmail.otp);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Tự động điền mã OTP từ modal vào form
  const handleAutoFillOtp = () => {
    if (simulatedEmail.otp) {
      setOtpCode(simulatedEmail.otp);
    }
    setShowEmailModal(false);
  };

  // Bước 2: Xác thực OTP và đặt lại mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedUser = username.trim();
    const trimmedOtp = otpCode.trim();

    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setErrorMsg('Mã OTP phải gồm chính xác 6 chữ số.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axiosClient.post('/auth/reset-password', {
        Username: trimmedUser,
        OtpCode: trimmedOtp,
        NewPassword: newPassword,
      });

      setSuccessMsg(res.data?.message || 'Khôi phục mật khẩu thành công! Đang chuyển về trang Đăng nhập...');

      // Tự động chuyển hướng về trang Đăng nhập sau 2.5 giây
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setErrorMsg(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{step === 1 ? 'QUÊN MẬT KHẨU' : 'ĐẶT LẠI MẬT KHẨU'}</h2>

        {errorMsg && <div className="auth-alert auth-alert-error">{errorMsg}</div>}
        {successMsg && <div className="auth-alert auth-alert-success">{successMsg}</div>}

        {/* BƯỚC 1: NHẬP TÊN ĐĂNG NHẬP ĐỂ NHẬN OTP */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp}>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px', textAlign: 'left', lineHeight: '1.5' }}>
              Vui lòng nhập tên đăng nhập của tài khoản bạn muốn khôi phục. Hệ thống sẽ tạo mã OTP xác thực và giả lập gửi về hòm thư Email của bạn.
            </p>

            <div className="input-group">
              <label htmlFor="forgot-username">Tên đăng nhập</label>
              <input
                id="forgot-username"
                type="text"
                placeholder="Nhập tên đăng nhập của bạn..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoFocus
                required
              />
            </div>

            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? 'ĐANG GỬI MÃ OTP...' : 'GỬI MÃ XÁC THỰC OTP'}
            </button>

            <div className="auth-footer">
              <span>Đã nhớ lại mật khẩu?</span>
              <Link to="/login">Quay lại Đăng nhập</Link>
            </div>
          </form>
        )}

        {/* BƯỚC 2: NHẬP OTP VÀ ĐẶT MẬT KHẨU MỚI */}
        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <button
              type="button"
              className="btn-open-simulated-email"
              onClick={() => setShowEmailModal(true)}
            >
              ✉️ Xem hộp thư Email giả lập (Mã OTP: {simulatedEmail.otp || '------'})
            </button>

            <div className="input-group">
              <label>Tài khoản khôi phục</label>
              <input
                type="text"
                value={username}
                disabled
                style={{ backgroundColor: '#f1f5f9', fontWeight: '600' }}
              />
            </div>

            <div className="input-group">
              <label htmlFor="reset-otp">Mã xác thực OTP (6 số)</label>
              <input
                id="reset-otp"
                type="text"
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="otp-digit-input"
                disabled={isLoading}
                required
              />
              <span className="input-hint">Mã OTP có hiệu lực trong vòng 5 phút.</span>
            </div>

            <div className="input-group">
              <label htmlFor="reset-newpassword">Mật khẩu mới</label>
              <input
                id="reset-newpassword"
                type="password"
                placeholder="Ít nhất 8 ký tự..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="reset-confirmpassword">Xác nhận mật khẩu mới</label>
              <input
                id="reset-confirmpassword"
                type="password"
                placeholder="Nhập lại mật khẩu mới..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? 'ĐANG CẬP NHẬT...' : 'ĐẶT LẠI MẬT KHẨU'}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setStep(1);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              disabled={isLoading}
            >
              ← Quay lại Bước 1 (Gửi lại mã OTP)
            </button>

            <div className="auth-footer">
              <Link to="/login">Về trang Đăng nhập</Link>
            </div>
          </form>
        )}
      </div>

      {/* POPUP MODAL GIẢ LẬP HỘP THƯ EMAIL */}
      {showEmailModal && (
        <div className="simulated-email-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="simulated-email-window" onClick={(e) => e.stopPropagation()}>
            <div className="email-window-header">
              <div className="email-window-title">
                <span>📧</span>
                <span>GIẢ LẬP HỘP THƯ EMAIL (LOCALHOST)</span>
              </div>
              <button
                type="button"
                className="btn-close-email"
                onClick={() => setShowEmailModal(false)}
                title="Đóng cửa sổ email"
              >
                ✕
              </button>
            </div>

            <div className="email-meta-panel">
              <div className="email-meta-row">
                <span className="email-meta-label">Người gửi:</span>
                <span className="email-meta-value">Hệ thống EduPlay &lt;{simulatedEmail.from}&gt;</span>
              </div>
              <div className="email-meta-row">
                <span className="email-meta-label">Đến:</span>
                <span className="email-meta-value" style={{ fontWeight: 600 }}>{simulatedEmail.to}</span>
              </div>
              <div className="email-meta-row">
                <span className="email-meta-label">Tiêu đề:</span>
                <span className="email-meta-value">{simulatedEmail.subject}</span>
              </div>
              <div className="email-meta-row">
                <span className="email-meta-label">Thời gian:</span>
                <span className="email-meta-value">{simulatedEmail.time}</span>
              </div>
            </div>

            <div className="email-body-content">
              <div className="email-app-brand">
                <span className="email-brand-badge">EduPlay</span>
                <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>Nền tảng Học tập & Đố vui</span>
              </div>

              <h4 className="email-subject-heading">Yêu cầu cấp mã xác thực khôi phục mật khẩu</h4>

              <p className="email-greeting">
                Xin chào tài khoản: <strong>{username}</strong>,
              </p>

              <p className="email-intro-text">
                Chúng tôi vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã xác thực OTP dùng một lần dưới đây để tiếp tục:
              </p>

              <div className="email-otp-display-box">
                <span className="otp-display-label">MÃ XÁC THỰC OTP (HẾT HẠN TRONG 5 PHÚT)</span>
                <div className="otp-digits-boxes">
                  {(simulatedEmail.otp || '000000').split('').map((digit, idx) => (
                    <div key={idx} className="otp-digit-card">
                      {digit}
                    </div>
                  ))}
                </div>
              </div>

              <div className="email-actions-row">
                <button
                  type="button"
                  className="btn-fill-otp"
                  onClick={handleAutoFillOtp}
                >
                  ✓ Tự động điền mã OTP này
                </button>
                <button
                  type="button"
                  className="btn-copy-otp"
                  onClick={handleCopyOtp}
                >
                  {isCopied ? 'Đã sao chép!' : 'Sao chép mã'}
                </button>
              </div>

              <p className="email-security-note">
                * Đây là giao diện giả lập hòm thư dành cho môi trường máy cá nhân. Trong môi trường thực tế, email này sẽ được gửi trực tiếp đến hộp thư cá nhân của bạn thông qua SMTP.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


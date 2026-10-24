import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import axiosClient from '../api/axiosClient';
import './Auth.css';

// Trích xuất thông báo lỗi chính xác từ response của Backend
function extractErrorMessage(error) {
  if (!error.response) {
    return 'Không thể kết nối đến máy chủ (cổng 5271/5000). Vui lòng đảm bảo đã chạy "dotnet run" trong thư mục EduPlay\\BE.';
  }
  const data = error.response.data;
  if (typeof data === 'string') return data;
  if (data?.message) return data.message;
  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ');
  }
  if (data?.title) return data.title;
  return 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại!';
}

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    // 1. Kiểm tra username theo đúng regex Backend: ^[a-zA-Z0-9_]+$
    if (!trimmedUsername) {
      setErrorMsg('Tên đăng nhập không được để trống.');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      setErrorMsg('Tên đăng nhập chỉ chứa chữ cái, số và dấu gạch dưới (không chứa dấu cách, @, ký tự đặc biệt).');
      return;
    }

    // 2. Kiểm tra email
    if (!trimmedEmail) {
      setErrorMsg('Vui lòng nhập địa chỉ email của phụ huynh để nhận mã OTP khôi phục.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg('Địa chỉ email không đúng định dạng (VD: example@gmail.com).');
      return;
    }

    // 3. Kiểm tra độ dài mật khẩu >= 8 theo yêu cầu Backend
    if (password.length < 8) {
      setErrorMsg('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    // 4. Kiểm tra mật khẩu xác nhận
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu nhập lại không khớp!');
      return;
    }

    setIsLoading(true);

    try {
      // Backend: Role 2 = Parent (UserRole enum: Admin = 1, Parent = 2, Student = 3)
      await axiosClient.post('/auth/register', {
        Username: trimmedUsername,
        Email: trimmedEmail,
        Password: password,
        Role: 2
      });

      setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển hướng sang Đăng nhập...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      
    } catch (error) {
      setErrorMsg(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>ĐĂNG KÝ TÀI KHOẢN PHỤ HUYNH</h2>
        
        {errorMsg && <div className="auth-alert auth-alert-error">{errorMsg}</div>}
        {successMsg && <div className="auth-alert auth-alert-success">{successMsg}</div>}

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label htmlFor="reg-username">Tên đăng nhập *</label>
            <input 
              id="reg-username"
              type="text" 
              placeholder="VD: nguyen_van_a" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={isLoading}
              required
            />
            <small className="input-hint">Chữ cái, số và gạch dưới (không dấu cách)</small>
          </div>

          <div className="input-group">
            <label htmlFor="reg-email">Địa chỉ Email *</label>
            <input 
              id="reg-email"
              type="email" 
              placeholder="VD: phuhuynh@gmail.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={isLoading}
              required
            />
            <small className="input-hint">Dùng để nhận mã xác thực OTP khôi phục mật khẩu</small>
          </div>

          <div className="input-group">
            <label htmlFor="reg-password">Mật khẩu *</label>
            <input 
              id="reg-password"
              type="password" 
              placeholder="Tối thiểu 8 ký tự..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={isLoading}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-confirm-password">Nhập lại mật khẩu</label>
            <input 
              id="reg-confirm-password"
              type="password" 
              placeholder="Nhập lại mật khẩu..." 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              disabled={isLoading}
              required
            />
          </div>

          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? 'ĐANG ĐĂNG KÝ...' : 'ĐĂNG KÝ'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Đã có tài khoản?</span>
          <Link to="/login">Đăng nhập ngay</Link>
        </div>
      </div>
    </div>
  );
}
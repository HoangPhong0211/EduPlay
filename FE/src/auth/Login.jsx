import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from './useAuth';
import { getUserFromToken } from './jwtHelper';
import './Auth.css';

// Trích xuất thông báo lỗi chính xác từ phản hồi Backend
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
  return 'Tài khoản hoặc mật khẩu không chính xác.';
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setErrorMsg('Vui lòng nhập tên đăng nhập.');
      return;
    }

    if (!password) {
      setErrorMsg('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axiosClient.post('/auth/login', {
        Username: trimmedUsername,
        Password: password,
      });

      const { isSuccess, message, token } = response.data;

      if (isSuccess && token) {
        // Lưu token và cập nhật trạng thái toàn cục trong AuthContext
        login(token);
        
        // Điều hướng theo phân quyền: Admin vào /admin, vai trò khác về /
        const parsedUser = getUserFromToken(token);
        if (parsedUser?.role === 'Admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        setErrorMsg(message || 'Đăng nhập không thành công.');
      }
    } catch (error) {
      setErrorMsg(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>ĐĂNG NHẬP</h2>

        {errorMsg && <div className="auth-alert auth-alert-error">{errorMsg}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="login-username">Tên đăng nhập</label>
            <input 
              id="login-username"
              type="text" 
              placeholder="Nhập tên đăng nhập của bạn..." 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={isLoading}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="login-password">Mật khẩu</label>
            <input 
              id="login-password"
              type="password" 
              placeholder="Nhập mật khẩu..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={isLoading}
              required
            />
          </div>

          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Chưa có tài khoản?</span>
          <Link to="/register">Đăng ký ở đây</Link>
        </div>
      </div>
    </div>
  );
}
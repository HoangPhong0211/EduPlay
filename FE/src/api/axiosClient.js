import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5271/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự động gắn Token trước khi gửi Request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý phản hồi lỗi từ server (Ví dụ token hết hạn hoặc không hợp lệ)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Xóa token hết hạn khỏi localStorage
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
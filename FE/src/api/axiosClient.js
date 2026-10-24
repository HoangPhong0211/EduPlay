import axios from 'axios';

// Danh sách các URL/Port của Backend (Cổng chính 5271, Cổng dự phòng 5000)
const defaultBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5271/api';
const CANDIDATE_URLS = [
  defaultBaseURL,
  'http://localhost:5000/api',
];

// Lấy URL đang hoạt động được lưu trước đó hoặc mặc định là 5271
let storedBaseURL = sessionStorage.getItem('active_api_url');
if (storedBaseURL && storedBaseURL.includes('5000')) {
  sessionStorage.removeItem('active_api_url');
  storedBaseURL = null;
}
let activeBaseURL = storedBaseURL || defaultBaseURL;

const axiosClient = axios.create({
  baseURL: activeBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // 45 giây để đảm bảo các tác vụ AI và dữ liệu lớn không bị timeout sớm
});

// Tự động gắn Token trước khi gửi Request và đảm bảo baseURL mới nhất
axiosClient.interceptors.request.use((config) => {
  config.baseURL = activeBaseURL;
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý phản hồi lỗi từ server và tự động thử cổng dự phòng nếu mất kết nối
axiosClient.interceptors.response.use(
  (response) => {
    // Nếu request thành công, ghi nhớ cổng này cho toàn bộ các request sau
    if (response.config?.baseURL && response.config.baseURL !== activeBaseURL) {
      activeBaseURL = response.config.baseURL;
      sessionStorage.setItem('active_api_url', activeBaseURL);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Xử lý token hết hạn (401 Unauthorized)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      return Promise.reject(error);
    }

    // Nếu xảy ra lỗi kết nối mạng thực sự (không phải do quá hạn timeout)
    // Tự động thử lại bằng cổng dự phòng khác nếu chưa từng retry
    if (
      !error.response &&
      error.code !== 'ECONNABORTED' &&
      originalRequest &&
      !originalRequest._retriedAlternative
    ) {
      originalRequest._retriedAlternative = true;

      const altUrl = CANDIDATE_URLS.find((url) => url !== activeBaseURL);
      if (altUrl) {
        console.warn(`[axiosClient] Không thể kết nối tới ${activeBaseURL}. Đang thử kết nối cổng dự phòng: ${altUrl}`);
        try {
          const retryConfig = { ...originalRequest, baseURL: altUrl };
          const retryResponse = await axios(retryConfig);
          activeBaseURL = altUrl;
          sessionStorage.setItem('active_api_url', altUrl);
          console.info(`[axiosClient] Kết nối thành công cổng dự phòng ${altUrl}`);
          return retryResponse;
        } catch (retryError) {
          // Cổng dự phòng cũng không phản hồi, giữ nguyên activeBaseURL chính
          return Promise.reject(error);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
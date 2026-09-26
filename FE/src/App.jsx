import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './shared/LandingPage';
import Login from './auth/Login';
import Register from './auth/Register';
import AdminLayout from './admin/AdminLayout';
import CourseManagement from './admin/CourseManagement';
import QuestionBank from './admin/QuestionBank';
import AutoTestGenerator from './admin/AutoTestGenerator';
import UserManagement from './admin/UserManagement';

function App() {
  return (
    <Routes>
      {/* Trang chủ EduPlay */}
      <Route path="/" element={<LandingPage />} />

      {/* Trang xác thực */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Phân hệ Quản trị viên */}
      <Route path="/admin" element={<AdminLayout />}>
        {/* Mặc định vào /admin sẽ chuyển hướng tới trang quản lý khóa học */}
        <Route index element={<Navigate to="courses" replace />} />

        {/* Alias điều hướng /admin/topics về courses */}
        <Route path="topics" element={<Navigate to="/admin/courses" replace />} />

        {/* Các trang chức năng con của Admin */}
        <Route path="courses" element={<CourseManagement />} />
        <Route path="questions" element={<QuestionBank />} />
        <Route path="generate-test" element={<AutoTestGenerator />} />
        <Route path="users" element={<UserManagement />} />
      </Route>

      {/* Bắt các đường dẫn không tồn tại và chuyển về trang chủ (luôn đặt ở cuối cùng) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
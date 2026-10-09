import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './shared/LandingPage';
import Login from './auth/Login';
import Register from './auth/Register';
import ForgotPassword from './auth/ForgotPassword';
import AdminLayout from './admin/AdminLayout';
import CourseManagement from './admin/CourseManagement';
import QuestionBank from './admin/QuestionBank';
import AutoTestGenerator from './admin/AutoTestGenerator';
import UserManagement from './admin/UserManagement';
import ParentLayout from './parent/ParentLayout';
import ParentDashboard from './parent/ParentDashboard';
import ChildManagement from './parent/ChildManagement';
import CompetencyReport from './parent/CompetencyReport';
import AssignmentManagement from './parent/AssignmentManagement';
import StudentLayout from './student/StudentLayout';
import StudentDashboard from './student/StudentDashboard';
import StudentRoadmap from './student/StudentRoadmap';
import StudentPractice from './student/StudentPractice';
import StudentAssignments from './student/StudentAssignments';
import StudentBadges from './student/StudentBadges';

function App() {
  return (
    <Routes>
      {/* Trang chủ EduPlay */}
      <Route path="/" element={<LandingPage />} />

      {/* Trang xác thực */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

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

      {/* Phân hệ Phụ huynh */}
      <Route path="/parent" element={<ParentLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ParentDashboard />} />
        <Route path="children" element={<ChildManagement />} />
        <Route path="report" element={<CompetencyReport />} />
        <Route path="assignments" element={<AssignmentManagement />} />
        <Route path="create-student" element={<Navigate to="/parent/children" replace />} />
      </Route>

      {/* Phân hệ Học sinh */}
      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="roadmap" element={<StudentRoadmap />} />
        <Route path="practice/:lessonId" element={<StudentPractice />} />
        <Route path="assignments" element={<StudentAssignments />} />
        <Route path="badges" element={<StudentBadges />} />
      </Route>

      {/* Bắt các đường dẫn không tồn tại và chuyển về trang chủ (luôn đặt ở cuối cùng) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
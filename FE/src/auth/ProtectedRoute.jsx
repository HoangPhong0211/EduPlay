import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * ProtectedRoute: Bảo vệ các tuyến đường dựa trên trạng thái đăng nhập và vai trò (Role).
 * 
 * @param {Array<string>} allowedRoles - Danh sách các role được phép truy cập (vd: ['Student'], ['Parent'], ['Admin'])
 * @param {React.ReactNode} children - Component con (nếu có)
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // 1. Nếu chưa đăng nhập, tự động redirect về /login và lưu lại đường dẫn hiện tại
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Chuẩn hóa role hiện tại (tránh lỗi hoa/thường)
  const currentRole = user.role || '';

  // 2. Nếu có chỉ định danh sách vai trò được phép truy cập
  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.some(
      (role) => role.toLowerCase() === currentRole.toLowerCase()
    );

    // Nếu không có quyền truy cập vào phân hệ này, tự động redirect về trang chủ hoặc dashboard tương ứng
    if (!isAllowed) {
      const lowerRole = currentRole.toLowerCase();
      if (lowerRole === 'admin') {
        return <Navigate to="/admin" replace />;
      }
      if (lowerRole === 'parent') {
        return <Navigate to="/parent" replace />;
      }
      if (lowerRole === 'student') {
        return <Navigate to="/student" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  // Cho phép truy cập: render children nếu được truyền, hoặc Outlet cho nested routes
  return children ? children : <Outlet />;
}

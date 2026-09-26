// Hàm giải mã JWT an toàn hỗ trợ tiếng Việt / Unicode
export function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Bóc tách thông tin người dùng từ token (Claims của ASP.NET Core)
export function getUserFromToken(token) {
  const decoded = parseJwt(token);
  if (!decoded) return null;

  // Kiểm tra thời hạn token (exp tính bằng giây)
  if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    return null;
  }

  const role =
    decoded.role ||
    decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
    '';
  const username =
    decoded.unique_name ||
    decoded.name ||
    decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
    '';
  const userId =
    decoded.nameid ||
    decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
    '';

  return { userId, username, role };
}

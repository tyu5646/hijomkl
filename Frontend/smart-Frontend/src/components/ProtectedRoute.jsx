import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem('token');
  const role = sessionStorage.getItem('role');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Redirect ตาม role
  if (location.pathname === '/' || location.pathname === '/owner' || location.pathname === '/admin') {
    if (role === 'owner' && location.pathname !== '/owner') {
      return <Navigate to="/owner" replace />;
    }
    if (role === 'admin' && location.pathname !== '/admin') {
      return <Navigate to="/admin" replace />;
    }
    if (role === 'customer' && location.pathname !== '/') {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
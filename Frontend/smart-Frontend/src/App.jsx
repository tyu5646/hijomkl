import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerHomePage from './pages/CustomerHomePage';
import OwnerHomePage from './pages/OwnerHomePage';
import AdminHomePage from './pages/AdminHomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDormApprovalPage from './pages/AdminDormApprovalPage';
import AdminUserManager from './pages/AdminUserManager';
import OwnerDormManagePage from './pages/OwnerDormManagePage';
import OwnerRoomManagePage from './pages/OwnerRoomManagePage';
import OwnerProfilePage from './pages/OwnerProfilePage';
import OwnerReviewManagePage from './pages/OwnerReviewManagePage';
import CustomerProfilePage from './pages/CustomerProfilePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <CustomerHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner"
          element={
            <ProtectedRoute>
              <OwnerHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dorms"
          element={
            <ProtectedRoute>
              <AdminDormApprovalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminUserManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/dorms"
          element={
            <ProtectedRoute>
              <OwnerDormManagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/rooms"
          element={
            <ProtectedRoute>
              <OwnerDormManagePage roomManageMode={true} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/dorms/:dormId/rooms"
          element={
            <ProtectedRoute>
              <OwnerRoomManagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/profile"
          element={
            <ProtectedRoute>
              <OwnerProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/reviews"
          element={
            <ProtectedRoute>
              <OwnerReviewManagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <CustomerProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
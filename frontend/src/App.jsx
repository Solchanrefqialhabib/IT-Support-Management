import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import BranchesPage from './pages/BranchesPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import VisitsPage from './pages/VisitsPage';
import UsersPage from './pages/UsersPage';
import CheckoutsPage from './pages/CheckoutsPage'; // <-- Import Halaman Pengeluaran
import ReturnsPage from './pages/ReturnsPage';     // <-- Import Halaman Pengembalian
import ProtectedRoute from './routes/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="branches" element={<BranchesPage />} />
            <Route path="visits" element={<VisitsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="checkouts" element={<CheckoutsPage />} /> {/* <-- Route Pengeluaran */}
            <Route path="returns" element={<ReturnsPage />} />     {/* <-- Route Pengembalian */}
            <Route path="users" element={<UsersPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
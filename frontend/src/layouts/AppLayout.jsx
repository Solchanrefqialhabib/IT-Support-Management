import { useState } from 'react';
import { FiBarChart2, FiBox, FiChevronLeft, FiGitBranch, FiLogOut, FiMenu, FiUser, FiMapPin, FiUsers, FiSend, FiRefreshCw } from 'react-icons/fi';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const userName = user?.name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();
  const userRole = user?.role ? user.role.replace('_', ' ') : 'Staff';

  // Daftar menu dasar ditambah Pengeluaran dan Pengembalian
  const baseMenu = [
    { to: '/', label: 'Dashboard', icon: FiBarChart2 },
    { to: '/branches', label: 'Master Cabang', icon: FiGitBranch },
    { to: '/visits', label: 'Kunjungan', icon: FiMapPin },
    { to: '/inventory', label: 'Inventaris', icon: FiBox },
    { to: '/checkouts', label: 'Pengeluaran', icon: FiSend },
    { to: '/returns', label: 'Pengembalian', icon: FiRefreshCw }
  ];

  // Tambahkan menu Manajemen Pengguna khusus jika role adalah ADMIN
  const menu = user?.role === 'ADMIN' 
    ? [...baseMenu, { to: '/users', label: 'Manajemen Pengguna', icon: FiUsers }]
    : baseMenu;

  return (
    <div className={`app ${open ? 'menu-open' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <span>IT</span>
          <div>Support<small>MANAGEMENT</small></div>
          <button className="close" onClick={() => setOpen(false)}>
            <FiChevronLeft />
          </button>
        </div>
        <nav>
          {menu.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>
              <Icon />{label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/profile"><FiUser />Profil Saya</NavLink>
          <button onClick={logout}><FiLogOut />Keluar</button>
        </div>
      </aside>
      
      {open && <div className="backdrop" style={{position: 'fixed', inset: 0, zIndex: 15, background: 'rgba(0,0,0,0.5)'}} onClick={() => setOpen(false)} />}
      
      <main>
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setOpen(true)}>
            <FiMenu />
          </button>
          <div className="topbar-title">IT Support Management</div>
          <NavLink to="/profile" className="user-chip">
            <span>{userInitial}</span>
            <div>
              <strong>{userName}</strong>
              <small>{userRole}</small>
            </div>
          </NavLink>
        </header>
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
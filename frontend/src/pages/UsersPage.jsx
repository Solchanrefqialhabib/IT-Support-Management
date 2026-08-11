import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiTrash2, FiEdit2, FiShield, FiX, FiSearch } from 'react-icons/fi';
import Swal from 'sweetalert2';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import api from '../services/api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: { role: 'IT_SUPPORT' }
  });

  const loadUsers = () => {
    setLoading(true);
    api.get('/users')
      .then((res) => {
        setUsers(res.data || res);
      })
      .catch((e) => Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, background: '#09090b', color: '#fff' }))
      .finally(() => setLoading(false));
  };

  useEffect(loadUsers, []);

  const openCreateModal = () => {
    setEditingUser(null);
    reset({ name: '', email: '', password: '', role: 'IT_SUPPORT' });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setValue('name', user.name);
    setValue('email', user.email);
    setValue('role', user.role);
    setValue('password', ''); // Kosongkan password saat edit (opsional)
    setIsModalOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, values);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data pengguna diperbarui', timer: 1500, showConfirmButton: false, background: '#09090b', color: '#fff' });
      } else {
        if (!values.password) {
          Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Password wajib diisi untuk akun baru', background: '#09090b', color: '#fff' });
          return;
        }
        await api.post('/users', values);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pengguna baru ditambahkan', timer: 1500, showConfirmButton: false, background: '#09090b', color: '#fff' });
      }

      setIsModalOpen(false);
      loadUsers();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: e.message || 'Terjadi kesalahan', background: '#09090b', color: '#fff' });
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Hapus Pengguna?',
      text: "Tindakan ini tidak dapat dibatalkan.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      background: '#09090b', color: '#fff'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/users/${id}`);
          Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Pengguna berhasil dihapus', timer: 1500, showConfirmButton: false, background: '#09090b', color: '#fff' });
          loadUsers();
        } catch (e) {
          Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, background: '#09090b', color: '#fff' });
        }
      }
    });
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PageHeader 
        eyebrow="ADMINISTRATION"
        title="Manajemen Pengguna" 
        description="Kelola akun staff IT, supervisor, dan administrator sistem." 
        action={
          <button className="primary-button" onClick={openCreateModal}>
            <FiPlus /> Tambah Pengguna
          </button>
        } 
      />

      <section className="panel table-panel">
        <div style={{ padding: '16px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Cari nama, email, role..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff', fontSize: '13px' }}
            />
          </div>
        </div>

        {loading ? <div className="content-loader">Memuat data pengguna...</div> : filteredUsers.length ? (
          <div className="table-scroll" style={{ marginTop: '12px' }}>
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Lengkap</th>
                  <th>Email</th>
                  <th>Role / Hak Akses</th>
                  <th>Terdaftar Sejak</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => (
                  <tr key={user.id}>
                    <td>{idx + 1}</td>
                    <td><strong>{user.name}</strong></td>
                    <td>{user.email}</td>
                    <td>
                      <span style={{ 
                        padding: '3px 8px', 
                        borderRadius: '4px', 
                        fontSize: '11px', 
                        fontWeight: 600,
                        background: user.role === 'ADMIN' ? 'rgba(31, 78, 120, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                        color: user.role === 'ADMIN' ? '#60a5fa' : '#fff'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString('id-ID')}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <button onClick={() => openEditModal(user)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer' }} title="Edit">
                          <FiEdit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(user.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Hapus">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState message="Tidak ada pengguna yang ditemukan." />}
      </section>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: '100%', maxWidth: '480px', padding: '24px 32px' }}>
            <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)}><FiX /></button>
            
            <div style={{ marginBottom: '16px' }}>
              <h2>{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                {editingUser ? 'Perbarui informasi akun atau hak akses.' : 'Daftarkan akun teknisi atau staff baru ke sistem.'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#fff' }}>Nama Lengkap</label>
                <input 
                  type="text" 
                  placeholder="Masukkan nama lengkap"
                  {...register('name', { required: true })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#fff' }}>Alamat Email</label>
                <input 
                  type="email" 
                  placeholder="email@domain.com"
                  {...register('email', { required: true })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#fff' }}>
                  Password {editingUser && '(Kosongkan jika tidak ingin diubah)'}
                </label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  {...register('password')} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#fff' }}>Role / Hak Akses</label>
                <select 
                  {...register('role', { required: true })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                >
                  <option value="IT_SUPPORT">IT Support</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPERVISOR">Supervisor</option>
                </select>
              </div>

              <button type="submit" className="primary-button full" style={{ marginTop: '10px', padding: '12px' }}>
                <FiShield /> {editingUser ? 'Simpan Perubahan' : 'Buat Akun Pengguna'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
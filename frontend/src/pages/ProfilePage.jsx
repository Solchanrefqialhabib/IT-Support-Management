import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiLock, FiUser, FiSave } from 'react-icons/fi';
import Swal from 'sweetalert2';
import PageHeader from '../components/PageHeader';
import api from '../services/api';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/profile');
      const userData = res.data || res;
      setProfile(userData);
      // Masukkan data awal ke dalam form
      reset({
        name: userData.name,
        email: userData.email,
      });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, background: '#09090b', color: '#fff' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const onSubmit = async (values) => {
    try {
      const payload = {
        name: values.name,
        email: values.email,
      };

      // Jika user mengisi password baru, sertakan password lama dan baru
      if (values.newPassword) {
        if (!values.oldPassword) {
          Swal.fire({ icon: 'warning', title: 'Peringatan', text: 'Password lama wajib diisi untuk mengubah password.', background: '#09090b', color: '#fff' });
          return;
        }
        payload.oldPassword = values.oldPassword;
        payload.newPassword = values.newPassword;
      }

      const res = await api.put('/users/profile', payload);
      Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message || 'Profil berhasil diperbarui!', background: '#09090b', color: '#fff' });
      
      // Kosongkan field password setelah sukses
      reset({
        name: values.name,
        email: values.email,
        oldPassword: '',
        newPassword: ''
      });
      loadProfile();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Gagal Memperbarui', text: e.message, background: '#09090b', color: '#fff' });
    }
  };

  if (loading) {
    return <div className="content-loader" style={{ padding: '40px', color: '#fff' }}>Memuat profil...</div>;
  }

  return (
    <>
      <PageHeader 
        eyebrow="USER SETTINGS"
        title="Profil Akun" 
        description="Informasi kredensial dan hak otorisasi workspace." 
      />

      <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Kartu Informasi Akun */}
        <section className="panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--bg-card, #121214)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#fff' }}>
            <FiUser />
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#fff' }}>{profile?.name}</h2>
            <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--text-muted)' }}>✉️ {profile?.email}</p>
            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontSize: '11px', fontWeight: 600 }}>
              {profile?.role}
            </span>
          </div>
        </section>

        {/* Panel Form Edit Profil & Ganti Password */}
        <section className="panel" style={{ padding: '24px', background: 'var(--bg-card, #121214)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#fff', borderBottom: '1px solid var(--border-light, #27272a)', paddingBottom: '10px' }}>
            Edit Informasi & Keamanan
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--text-muted)' }}>Nama Lengkap</label>
                <input 
                  type="text" 
                  {...register('name', { required: 'Nama wajib diisi' })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--text-muted)' }}>Alamat Email</label>
                <input 
                  type="email" 
                  {...register('email', { required: 'Email wajib diisi' })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-light, #27272a)', margin: '8px 0' }} />

            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#fff' }}>Ubah Kata Sandi (Opsional)</h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-muted)' }}>Kosongkan jika Anda tidak ingin mengganti password.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--text-muted)' }}>Password Lama</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  {...register('oldPassword')} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--text-muted)' }}>Password Baru</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  {...register('newPassword')} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" className="primary-button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
                <FiSave /> Simpan Perubahan
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
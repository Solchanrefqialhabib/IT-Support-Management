import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FiArrowRight, FiLock, FiMail, FiServer } from 'react-icons/fi'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { user, login } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />

  const submit = async (values) => {
    setSubmitting(true); 
    setError('');
    try { 
      await login(values); 
    } 
    catch (err) { 
      setError(err.message); 
    } 
    finally { 
      setSubmitting(false); 
    }
  };

  return (
    <div className="login-shell">
      <section className="login-aside">
        <div className="brand login-brand">
          <span className="logo-box"><FiServer /></span>
          <div>Infrastructure<small>SUPPORT_WORKSPACE</small></div>
        </div>
        <div className="hero-text-container">
          <span className="eyebrow">NODE & ASSET MANAGEMENT</span>
          <h1>Kendalikan infrastruktur<br/>dari satu titik.</h1>
          <p>Sistem terpusat untuk memantau log kunjungan lapangan, mutasi perangkat jaringan, dan pemeliharaan ekosistem secara real-time.</p>
        </div>
        <div className="login-foot">
          <div className="status-indicator">
            <span className="pulse-dot"></span>
            SYSTEM ONLINE — ALL PROTOCOLS OPERATIONAL
          </div>
        </div>
      </section>

      <section className="login-card-wrap">
        <form className="login-card" onSubmit={handleSubmit(submit)}>
          <div className="card-header">
            <h2>Akses Dashboard</h2>
            <p>Masukkan kredensial administrator Anda.</p>
          </div>
          
          {error && <div className="form-error">{error}</div>}
          
          <label>Alamat Email
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input type="email" placeholder="admin@network.local" {...register('email', { required: 'Email wajib diisi' })} />
            </div>
            {errors.email && <em>{errors.email.message}</em>}
          </label>
          
          <label>Kata Sandi
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input type="password" placeholder="••••••••" {...register('password', { required: 'Password wajib diisi' })} />
            </div>
            {errors.password && <em>{errors.password.message}</em>}
          </label>
          
          <button className="primary-button full" disabled={submitting}>
            {submitting ? 'MEMVERIFIKASI...' : <>OTORISASI MASUK <FiArrowRight /></>}
          </button>
        </form>
      </section>
    </div>
  );
}
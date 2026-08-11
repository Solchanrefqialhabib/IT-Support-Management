import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiEdit2, FiMapPin, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import Swal from 'sweetalert2';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export default function BranchesPage() {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const { register, reset, handleSubmit, formState: { errors } } = useForm();

  const load = () => {
    setLoading(true);
    api.get('/branches')
      .then(({ data }) => setBranches(data))
      .catch((e) => Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, background: '#09090b', color: '#fff' }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const close = () => { setEditing(null); reset(); };

  const openEdit = (branch = {}) => {
    setEditing(branch);
    reset({ name: branch.name || '', address: branch.address || '', allowance: branch.allowance ?? '' });
  };

  const submit = async (values) => {
    try {
      const result = editing.id ? api.put(`/branches/${editing.id}`, values) : api.post('/branches', values);
      await result;
      await Swal.fire({ icon: 'success', title: 'Tersimpan', timer: 1000, showConfirmButton: false, background: '#09090b', color: '#fff' });
      close();
      load();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, background: '#09090b', color: '#fff' });
    }
  };

  const remove = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus cabang?',
      text: 'Data yang terikat kunjungan tidak dapat dihapus.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
      background: '#09090b', color: '#fff'
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/branches/${id}`);
        load();
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, background: '#09090b', color: '#fff' });
      }
    }
  };

  const allowed = user?.role === 'ADMIN';

  return (
    <>
      <PageHeader 
        eyebrow="MASTER DATA"
        title="Daftar Cabang" 
        description="Kelola lokasi layanan dan nominal otomatisasi uang jalan." 
        action={allowed && <button className="primary-button" onClick={() => openEdit()}><FiPlus /> Tambah Node</button>} 
      />

      <section className="panel table-panel">
        {loading ? (
          <div className="content-loader">Memuat topologi cabang...</div>
        ) : branches.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Lokasi / Cabang</th>
                  <th>Alamat Fisik</th>
                  <th>Allowance Rate</th>
                  {allowed && <th aria-label="Aksi" />}
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr key={branch.id}>
                    <td>
                      <strong>{branch.name}</strong>
                      <small style={{ fontFamily: 'Space Mono' }}>ID #{branch.id}</small>
                    </td>
                    <td>
                      <span className="muted"><FiMapPin /> {branch.address || 'Tidak ada alamat terdaftar'}</span>
                    </td>
                    <td>
                      <strong style={{ fontFamily: 'Space Mono' }}>{formatter.format(branch.allowance)}</strong>
                    </td>
                    {allowed && (
                      <td className="actions">
                        <button onClick={() => openEdit(branch)}><FiEdit2 /></button>
                        <button className="danger" onClick={() => remove(branch.id)}><FiTrash2 /></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Belum ada data cabang." />
        )}
      </section>

      {editing && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={handleSubmit(submit)}>
            <button type="button" className="modal-close" onClick={close}><FiX /></button>
            <h2>{editing.id ? 'Perbarui Cabang' : 'Registrasi Cabang Baru'}</h2>
            <p>Parameter ini digunakan dalam perhitungan kalkulator perjalanan.</p>
            
            <label>Nama / Kode Cabang
              <input autoFocus placeholder="Misal: Tegal Pusat" {...register('name', { required: 'Nama cabang wajib diisi' })}/>
              {errors.name && <em className="form-error">{errors.name.message}</em>}
            </label>
            
            <label>Alamat Lengkap
              <textarea rows="3" placeholder="Alamat fisik cabang..." {...register('address')} />
            </label>
            
            <label>Tarif Allowance (Rp)
              <input type="number" min="0" {...register('allowance', { required: 'Allowance wajib diisi', min: 0 })}/>
              {errors.allowance && <em className="form-error">Masukkan nominal yang valid.</em>}
            </label>
            
            <button className="primary-button full" style={{ marginTop: '16px' }}>Simpan Konfigurasi</button>
          </form>
        </div>
      )}
    </>
  );
}
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiClock, FiDownload, FiEdit2, FiImage, FiMessageSquare, FiPlus, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import Swal from 'sweetalert2';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import api from '../services/api';
import { useAuth } from '../context/AuthContext'; 

const today = new Date().toISOString().slice(0, 10);
const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const categoriesList = ['VPN', 'Office', 'Hardware', 'Jaringan', 'Lainnya'];
const statusList = ['SELESAI', 'PENDING', 'PROSES', 'BATAL'];

export default function VisitsPage() {
  const { user } = useAuth(); 
  
  // HANYA IT_SUPPORT yang memiliki akses penuh untuk input dan kirim WA
  const isITSupport = user?.role === 'IT_SUPPORT';

  const [visits, setVisits] = useState([]);
  const [branches, setBranches] = useState([]);
  const [create, setCreate] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState(today);
  const [exportEndDate, setExportEndDate] = useState(today);

  const [selectedBranches, setSelectedBranches] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  const [beforeFile, setBeforeFile] = useState(null);
  const [afterFile, setAfterFile] = useState(null);

  const { register, handleSubmit, reset, setValue } = useForm({ 
    defaultValues: { date: today, status: 'SELESAI', startTime: '08:00', endTime: '17:00' } 
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([api.get('/visits'), api.get('/branches')])
      .then(([v, b]) => { 
        setVisits(v.data || v); 
        setBranches(b.data || b); 
      })
      .catch((e) => Swal.fire({ icon: 'error', title: 'Gagal', text: e?.message || 'Gagal memuat data', background: '#09090b', color: '#fff' }))
      .finally(() => setLoading(false));
  };
  
  useEffect(loadData, []);

  const handleSendDailyReportWA = async () => {
    if (!isITSupport) return;
    try {
      Swal.fire({
        title: 'Mengirim Laporan...',
        text: 'Mohon tunggu sebentar, sedang mengirim rekap ke WhatsApp.',
        allowOutsideClick: false,
        background: '#09090b', color: '#fff',
        didOpen: () => { Swal.showLoading(); }
      });

      const res = await api.post('/wa/daily-report');
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: res?.data?.message || 'Laporan rekap kunjungan berhasil dikirim ke WhatsApp.',
        background: '#09090b', color: '#fff'
      });
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Terjadi kesalahan pada server.';
      
      Swal.fire({
        icon: 'error',
        title: 'Gagal Kirim WA',
        text: errorMsg,
        background: '#09090b', color: '#fff'
      });
    }
  };

  const handleBranchToggle = (branchId) => {
    setSelectedBranches(prev => 
      prev.includes(branchId) ? prev.filter(id => id !== branchId) : [...prev, branchId]
    );
  };

  const handleCategoryToggle = (cat) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const openEditModal = (visit) => {
    if (!isITSupport) return; 
    setEditingVisit(visit);
    setValue('date', visit.date ? visit.date.slice(0, 10) : today);
    setValue('status', visit.status || 'SELESAI');
    setValue('startTime', visit.startTime || '08:00');
    setValue('endTime', visit.endTime || '17:00');
    setValue('beforeCondition', visit.beforeCondition || '');
    setValue('solution', visit.solution || '');

    setSelectedBranches(visit.branchId ? [visit.branchId] : []);
    
    if (visit.category) {
      const cats = visit.category.split(', ').map(c => c.trim());
      setSelectedCategories(cats);
    } else {
      setSelectedCategories([]);
    }

    setBeforeFile(null);
    setAfterFile(null);
    setCreate(true);
  };

  const openCreateModal = () => {
    if (!isITSupport) return; 
    setEditingVisit(null);
    setSelectedBranches([]);
    setSelectedCategories([]);
    setBeforeFile(null);
    setAfterFile(null);
    reset({ date: today, status: 'SELESAI', startTime: '08:00', endTime: '17:00' });
    setCreate(true);
  };

  const handleDeleteVisit = async (id) => {
    if (!isITSupport) return;
    Swal.fire({
      title: 'Hapus Kunjungan?',
      text: "Data log kunjungan ini akan dihapus permanen.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      background: '#09090b', color: '#fff'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/visits/${id}`);
          Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Data kunjungan berhasil dihapus.', background: '#09090b', color: '#fff', timer: 1200, showConfirmButton: false });
          loadData();
        } catch (e) {
          Swal.fire({ icon: 'error', title: 'Gagal', text: e?.message || 'Gagal menghapus', background: '#09090b', color: '#fff' });
        }
      }
    });
  };

  const submit = async (values) => {
    if (!isITSupport) return;
    try {
      if (selectedBranches.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Pilih minimal 1 cabang tujuan', background: '#09090b', color: '#fff' });
        return;
      }
      if (selectedCategories.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Pilih minimal 1 kategori kendala', background: '#09090b', color: '#fff' });
        return;
      }

      const formData = new FormData();
      formData.append('date', values.date);
      selectedBranches.forEach(bId => formData.append('branchIds[]', bId));
      formData.append('branchId', selectedBranches[0]);
      formData.append('category', selectedCategories.join(', '));
      formData.append('beforeCondition', values.beforeCondition || '');
      formData.append('solution', values.solution || '');
      formData.append('status', values.status);
      formData.append('startTime', values.startTime || '08:00');
      formData.append('endTime', values.endTime || '17:00');

      if (beforeFile) formData.append('beforeImage', beforeFile);
      if (afterFile) formData.append('afterImage', afterFile);

      if (editingVisit) {
        await api.put(`/visits/${editingVisit.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire({ icon: 'success', title: 'Kunjungan diperbarui', timer: 1500, showConfirmButton: false, background: '#09090b', color: '#fff' });
      } else {
        await api.post('/visits', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire({ icon: 'success', title: 'Kunjungan dicatat', timer: 1500, showConfirmButton: false, background: '#09090b', color: '#fff' });
      }

      setCreate(false);
      setEditingVisit(null);
      setSelectedBranches([]);
      setSelectedCategories([]);
      setBeforeFile(null);
      setAfterFile(null);
      reset({ date: today, status: 'SELESAI', startTime: '08:00', endTime: '17:00' });
      loadData();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: e?.message || 'Gagal menyimpan', background: '#09090b', color: '#fff' });
    }
  };

  const exportExcelCustom = async () => {
    try {
      const response = await api.get('/reports/visits', { 
        params: { startDate: exportStartDate, endDate: exportEndDate },
        responseType: 'blob' 
      });
      const url = window.URL.createObjectURL(new Blob([response.data || response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan_Perjalanan_Dinas_${exportStartDate}_sampai_${exportEndDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setShowExportModal(false);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal Ekspor', text: 'Tidak dapat mengunduh file Excel.', background: '#09090b', color: '#fff' });
    }
  };

  const filteredVisits = visits.filter(visit => 
    visit.branch?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    visit.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    visit.beforeCondition?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    visit.solution?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PageHeader 
        eyebrow="FIELD OPERATIONS"
        title="Log Kunjungan" 
        description="Pencatatan aktivitas lapangan dan dokumentasi foto." 
        action={
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* Tombol Catat Kunjungan HANYA MUNCUL untuk IT Support */}
            {isITSupport && (
              <button className="primary-button" onClick={openCreateModal}>
                <FiPlus /> Catat Kunjungan
              </button>
            )}

            {/* Tombol Kirim Laporan WA HANYA MUNCUL untuk IT Support */}
            {isITSupport && (
              <button className="primary-button" style={{ background: '#22c55e', color: '#fff', border: 'none' }} onClick={handleSendDailyReportWA}>
                <FiMessageSquare /> Kirim Laporan WA
              </button>
            )}

            <button className="primary-button" style={{ background: 'transparent', color: 'var(--text-main)' }} onClick={() => setShowExportModal(true)}>
              <FiDownload /> Excel
            </button>
          </div>
        } 
      />

      <section className="panel table-panel">
        <div style={{ padding: '16px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Cari cabang, kategori, kendala..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff', fontSize: '13px' }}
            />
          </div>
        </div>

        {loading ? <div className="content-loader">Memuat kunjungan...</div> : filteredVisits.length ? (
          <div className="table-scroll" style={{ marginTop: '12px' }}>
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Cabang</th>
                  <th>Kategori</th>
                  <th>Jam Kerja</th>
                  <th>Sebelum / Sesudah</th>
                  <th>Uang Jalan</th>
                  <th>Dokumentasi</th>
                  <th>Status</th>
                  {isITSupport && <th style={{ textAlign: 'center' }}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filteredVisits.map((visit) => (
                  <tr key={visit.id}>
                    <td>{new Date(visit.date).toLocaleDateString('id-ID')}</td>
                    <td><strong>{visit.branch?.name}</strong></td>
                    <td>{visit.category}</td>
                    <td><small>🕒 {visit.startTime || '08:00'} - {visit.endTime || '17:00'}</small></td>
                    <td>
                      <div style={{ fontSize: '11px', maxWidth: '220px' }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>Before:</span> {visit.beforeCondition || '-'}</div>
                        <div style={{ marginTop: '2px' }}><span style={{ color: 'var(--text-muted)' }}>After:</span> {visit.solution || '-'}</div>
                      </div>
                    </td>
                    <td><strong>{formatter.format(visit.allowance || visit.branch?.allowance || 0)}</strong></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {visit.beforeImage && <a href={`http://localhost:5000${visit.beforeImage}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', fontSize: '11px', textDecoration: 'underline' }}>[Before]</a>}
                        {visit.afterImage && <a href={`http://localhost:5000${visit.afterImage}`} target="_blank" rel="noreferrer" style={{ color: 'var(--success)', fontSize: '11px', textDecoration: 'underline' }}>[After]</a>}
                        {!visit.beforeImage && !visit.afterImage && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>-</span>}
                      </div>
                    </td>
                    <td><span className={`status ${visit.status === 'SELESAI' ? 'done' : 'pending'}`}>{visit.status}</span></td>
                    
                    {isITSupport && (
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => openEditModal(visit)} 
                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer' }}
                            title="Edit Kunjungan"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteVisit(visit.id)} 
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            title="Hapus Kunjungan"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState message="Tidak ada data kunjungan yang cocok dengan pencarian." />}
      </section>

      {showExportModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: '100%', maxWidth: '420px', padding: '24px 32px' }}>
            <button type="button" className="modal-close" onClick={() => setShowExportModal(false)}><FiX /></button>
            <div style={{ marginBottom: '16px' }}>
              <h2>Pilih Periode Laporan</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Tentukan rentang tanggal untuk unduh laporan Excel.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#fff' }}>Dari Tanggal</label>
                <input 
                  type="date" 
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff', colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#fff' }}>Sampai Tanggal</label>
                <input 
                  type="date" 
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff', colorScheme: 'dark' }}
                />
              </div>
              <button type="button" className="primary-button full" onClick={exportExcelCustom} style={{ marginTop: '10px', padding: '12px' }}>
                <FiDownload /> Unduh Laporan Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {create && isITSupport && (
        <div className="modal-backdrop">
          <div className="modal visit-modal" style={{ width: '100%', maxWidth: '620px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '24px 32px' }}>
            <button type="button" className="modal-close" onClick={() => { setCreate(false); setEditingVisit(null); setSelectedBranches([]); setSelectedCategories([]); }}><FiX /></button>
            
            <div style={{ marginBottom: '14px' }}>
              <h2>{editingVisit ? 'Edit Kunjungan & Dokumentasi' : 'Catat Kunjungan & Dokumentasi'}</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                {editingVisit ? 'Perbarui detail informasi kunjungan lapangan.' : 'Pilih beberapa cabang sekaligus dan unggah foto dokumentasi.'}
              </p>
            </div>

            <form onSubmit={handleSubmit(submit)} style={{ overflowY: 'auto', paddingRight: '4px', flex: 1 }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px', color: '#fff' }}>Tanggal Kunjungan</label>
                <input 
                  type="date" 
                  {...register('date', { required: true })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff', colorScheme: 'dark' }}
                />
              </div>

              <label style={{ margin: '10px 0 6px', display: 'block', fontSize: '13px', color: '#fff' }}>Cabang Tujuan (Bisa Pilih Lebih dari Satu)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '12px', maxHeight: '120px', overflowY: 'auto', padding: '4px', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                {branches.map((b) => {
                  const isChecked = selectedBranches.includes(b.id);
                  return (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => handleBranchToggle(b.id)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${isChecked ? 'var(--text-main)' : 'var(--border-light)'}`,
                        background: isChecked ? 'rgba(255,255,255,0.12)' : 'var(--bg-main)',
                        color: isChecked ? '#fff' : 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: 500,
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <span>{b.name}</span>
                      {isChecked && <span style={{ color: 'var(--success)' }}>✓</span>}
                    </button>
                  );
                })}
              </div>

              <label style={{ margin: '10px 0 6px', display: 'block', fontSize: '13px', color: '#fff' }}>Kategori Kendala (Pilih Satu atau Lebih)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
                {categoriesList.map((cat) => {
                  const isChecked = selectedCategories.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => handleCategoryToggle(cat)}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: `1px solid ${isChecked ? 'var(--text-main)' : 'var(--border-light)'}`,
                        background: isChecked ? 'rgba(255,255,255,0.12)' : 'var(--bg-main)',
                        color: isChecked ? '#fff' : 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: 500,
                        textAlign: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      {isChecked ? '✓ ' : ''}{cat}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <label style={{ margin: 0, fontSize: '12px', color: '#fff' }}>Kondisi Sebelum (Before)
                  <textarea rows="2" placeholder="Deskripsi awal..." {...register('beforeCondition')} style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }} />
                </label>
                <label style={{ margin: 0, fontSize: '12px', color: '#fff' }}>Tindakan / Sesudah (After)
                  <textarea rows="2" placeholder="Penyelesaian..." {...register('solution')} style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }} />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <label style={{ margin: 0, fontSize: '12px', color: '#fff' }}>Foto Before (Opsional ganti)
                  <input type="file" accept="image/*" onChange={(e) => setBeforeFile(e.target.files[0])} style={{ width: '100%', fontSize: '11px', padding: '6px', marginTop: '4px', background: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border-light)', color: '#fff' }} />
                </label>
                <label style={{ margin: 0, fontSize: '12px', color: '#fff' }}>Foto After (Opsional ganti)
                  <input type="file" accept="image/*" onChange={(e) => setAfterFile(e.target.files[0])} style={{ width: '100%', fontSize: '11px', padding: '6px', marginTop: '4px', background: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border-light)', color: '#fff' }} />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                <label style={{ margin: 0, fontSize: '12px', color: '#fff' }}>Status Kunjungan
                  <select {...register('status')} style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '6px', background: '#18181b', border: '1px solid var(--border-light)', color: '#fff' }}>
                    {statusList.map((st) => (
                      <option key={st} value={st} style={{ background: '#18181b', color: '#fff' }}>{st}</option>
                    ))}
                  </select>
                </label>
                <label style={{ margin: 0, fontSize: '12px', color: '#fff' }}>Jam Mulai
                  <input type="time" {...register('startTime', { required: true })} style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff', colorScheme: 'dark' }}/>
                </label>
                <label style={{ margin: 0, fontSize: '12px', color: '#fff' }}>Jam Selesai
                  <input type="time" {...register('endTime', { required: true })} style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff', colorScheme: 'dark' }}/>
                </label>
              </div>
              
              <button type="submit" className="primary-button full" style={{ marginTop: '4px', padding: '12px' }}>
                <FiImage /> {editingVisit ? 'Perbarui Kunjungan' : 'Simpan Kunjungan & Dokumentasi'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
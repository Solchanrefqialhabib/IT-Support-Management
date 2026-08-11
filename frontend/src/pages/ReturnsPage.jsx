import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiRefreshCw, FiPlus, FiX, FiTrash2, FiEdit2 } from 'react-icons/fi';
import Swal from 'sweetalert2';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ReturnsPage() {
  const { user } = useAuth();
  const isSupervisor = user?.role === 'SUPERVISOR';

  const [returns, setReturns] = useState([]);
  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { date: new Date().toISOString().slice(0, 10), quantity: 1, status: 'RUSAK' }
  });

  const { register: registerStatus, handleSubmit: handleSubmitStatus, setValue: setStatusValue } = useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const [resReturns, resItems, resBranches] = await Promise.all([
        api.get('/returns'),
        api.get('/items'),
        api.get('/branches')
      ]);
      setReturns(resReturns.data || resReturns);
      setItems(resItems.data || resItems);
      setBranches(resBranches.data || resBranches);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, background: '#09090b', color: '#fff' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    reset({ date: new Date().toISOString().slice(0, 10), quantity: 1, status: 'RUSAK', serialNumber: '', damage: '' });
    setCreateModal(true);
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        itemId: Number(values.itemId),
        branchId: Number(values.branchId),
        date: values.date,
        quantity: Number(values.quantity),
        serialNumber: values.serialNumber,
        damage: values.damage,
        status: values.status
      };

      await api.post('/returns', payload);
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pengembalian aset berhasil dicatat!', background: '#09090b', color: '#fff', timer: 2000, showConfirmButton: false });
      
      setCreateModal(false);
      loadData();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Gagal Memproses', text: e.message, background: '#09090b', color: '#fff' });
    }
  };

  const handleDelete = async (id) => {
    if (isSupervisor) return;
    Swal.fire({
      title: 'Hapus Data Return?',
      text: "Data yang dihapus tidak dapat dikembalikan.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Tutup',
      background: '#09090b', color: '#fff'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/returns/${id}`);
          Swal.fire({ icon: 'success', title: 'Dihapus', text: 'Catatan pengembalian telah dihapus.', background: '#09090b', color: '#fff', timer: 1500, showConfirmButton: false });
          loadData();
        } catch (e) {
          Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, background: '#09090b', color: '#fff' });
        }
      }
    });
  };

  const openStatusModal = (ret) => {
    setSelectedReturn(ret);
    setStatusValue('status', ret.status);
    setStatusModal(true);
  };

  const onUpdateStatus = async (values) => {
    try {
      await api.put(`/returns/${selectedReturn.id}/status`, { status: values.status });
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Status berhasil diperbarui!', background: '#09090b', color: '#fff', timer: 1500, showConfirmButton: false });
      setStatusModal(false);
      loadData();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, background: '#09090b', color: '#fff' });
    }
  };

  return (
    <>
      <PageHeader 
        eyebrow="LOGISTICS"
        title="Pengembalian Aset (Return)" 
        description="Catat perangkat yang dikembalikan dari cabang, rusak, atau RMA." 
        action={
          !isSupervisor && (
            <button className="primary-button" onClick={openCreateModal}>
              <FiPlus /> Catat Pengembalian
            </button>
          )
        } 
      />

      <section className="panel table-panel">
        {loading ? (
          <div className="content-loader">Memuat riwayat pengembalian...</div>
        ) : returns.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nama Barang</th>
                  <th>Asal Cabang</th>
                  <th>Serial Number</th>
                  <th>Kendala/Kerusakan</th>
                  <th>Status</th>
                  {!isSupervisor && <th style={{ textAlign: 'center' }}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {returns.map((ret) => (
                  <tr key={ret.id}>
                    <td>{new Date(ret.date).toLocaleDateString('id-ID')}</td>
                    <td>
                      <strong>{ret.item?.itemName}</strong>
                      <small style={{ fontFamily: 'Space Mono' }}>{ret.item?.itemCode}</small>
                    </td>
                    <td>{ret.branch?.name}</td>
                    <td><small>{ret.serialNumber}</small></td>
                    <td>{ret.damage}</td>
                    <td>
                      <span className={`status ${ret.status === 'READY' ? 'done' : 'pending'}`}>
                        {ret.status}
                      </span>
                    </td>
                    {!isSupervisor && (
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => openStatusModal(ret)} 
                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer' }}
                            title="Update Status"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(ret.id)} 
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            title="Hapus Data"
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
        ) : (
          <EmptyState title="Belum ada transaksi" message="Belum ada catatan pengembalian perangkat." />
        )}
      </section>

      {/* MODAL RETURN BARU */}
      {createModal && !isSupervisor && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: '100%', maxWidth: '500px', padding: '24px 32px' }}>
            <button type="button" className="modal-close" onClick={() => setCreateModal(false)}><FiX /></button>
            
            <div style={{ marginBottom: '16px' }}>
              <h2>Catat Pengembalian Barang</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Catat barang rusak/RMA yang ditarik dari cabang.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#fff' }}>Barang yang dikembalikan</label>
                  <select 
                    {...register('itemId', { required: true })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                  >
                    <option value="">-- Pilih Barang --</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.itemCode} - {item.itemName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#fff' }}>Asal Cabang</label>
                  <select 
                    {...register('branchId', { required: true })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                  >
                    <option value="">-- Pilih Cabang --</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#fff' }}>Tanggal</label>
                  <input 
                    type="date" 
                    {...register('date', { required: true })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff', colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#fff' }}>Jumlah</label>
                  <input 
                    type="number" 
                    min="1"
                    {...register('quantity', { required: true })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#fff' }}>Status Fisik</label>
                  <select 
                    {...register('status', { required: true })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                  >
                    <option value="RUSAK">RUSAK</option>
                    <option value="RMA">RMA (Garansi)</option>
                    <option value="READY">READY (Bagus)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#fff' }}>Serial Number</label>
                <input 
                  type="text" 
                  placeholder="SN Perangkat (Wajib untuk klaim)" 
                  {...register('serialNumber', { required: true })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#fff' }}>Detail Kendala / Kerusakan</label>
                <textarea 
                  rows="2" 
                  placeholder="Jelaskan kondisi barang saat dikembalikan..." 
                  {...register('damage', { required: true })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                />
              </div>

              <button type="submit" className="primary-button full" style={{ marginTop: '10px', padding: '12px' }}>
                <FiRefreshCw /> Proses Pengembalian Barang
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UPDATE STATUS RETURN */}
      {statusModal && !isSupervisor && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: '100%', maxWidth: '400px', padding: '24px 32px' }}>
            <button type="button" className="modal-close" onClick={() => setStatusModal(false)}><FiX /></button>
            <div style={{ marginBottom: '16px' }}>
              <h2>Update Status Barang</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Jika barang sudah selesai diperbaiki, ubah status ke READY agar masuk kembali ke stok gudang.
              </p>
            </div>
            <form onSubmit={handleSubmitStatus(onUpdateStatus)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#fff' }}>Ubah Status Ke</label>
                <select 
                  {...registerStatus('status', { required: true })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                >
                  <option value="RUSAK">RUSAK</option>
                  <option value="RMA">RMA (Sedang Digaransikan)</option>
                  <option value="READY">READY (Sudah Bagus / Masuk Stok)</option>
                </select>
              </div>
              <button type="submit" className="primary-button full" style={{ marginTop: '10px', padding: '12px' }}>
                Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
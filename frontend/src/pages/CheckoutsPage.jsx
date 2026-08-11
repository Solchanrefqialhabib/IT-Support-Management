import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiSend, FiPlus, FiX, FiTrash2 } from 'react-icons/fi';
import Swal from 'sweetalert2';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CheckoutsPage() {
  const { user } = useAuth();
  const isSupervisor = user?.role === 'SUPERVISOR';

  const [checkouts, setCheckouts] = useState([]);
  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { date: new Date().toISOString().slice(0, 10), quantity: 1 }
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [resCheckouts, resItems, resBranches] = await Promise.all([
        api.get('/checkouts'),
        api.get('/items'),
        api.get('/branches')
      ]);
      setCheckouts(resCheckouts.data || resCheckouts);
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
    reset({ date: new Date().toISOString().slice(0, 10), quantity: 1, purpose: '' });
    setCreateModal(true);
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        itemId: Number(values.itemId),
        branchId: Number(values.branchId),
        date: values.date,
        quantity: Number(values.quantity),
        purpose: values.purpose
      };

      await api.post('/checkouts', payload);
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Barang berhasil dikeluarkan, stok otomatis berkurang!', background: '#09090b', color: '#fff', timer: 2000, showConfirmButton: false });
      
      setCreateModal(false);
      loadData(); // Refresh tabel checkout
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Gagal Checkout', text: e.message, background: '#09090b', color: '#fff' });
    }
  };

  const handleDelete = async (id) => {
    if (isSupervisor) return;
    Swal.fire({
      title: 'Batalkan Checkout?',
      text: "Stok barang akan dikembalikan ke gudang.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Batalkan',
      cancelButtonText: 'Tutup',
      background: '#09090b', color: '#fff'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/checkouts/${id}`);
          Swal.fire({ icon: 'success', title: 'Dibatalkan', text: 'Stok telah dikembalikan.', background: '#09090b', color: '#fff', timer: 1500, showConfirmButton: false });
          loadData();
        } catch (e) {
          Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, background: '#09090b', color: '#fff' });
        }
      }
    });
  };

  return (
    <>
      <PageHeader 
        eyebrow="LOGISTICS"
        title="Pengeluaran Aset (Checkout)" 
        description="Catat barang yang dipakai/dipinjam ke cabang. Stok akan terpotong otomatis." 
        action={
          !isSupervisor && (
            <button className="primary-button" onClick={openCreateModal}>
              <FiPlus /> Buat Checkout Baru
            </button>
          )
        } 
      />

      <section className="panel table-panel">
        {loading ? (
          <div className="content-loader">Memuat riwayat pengeluaran...</div>
        ) : checkouts.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nama Barang</th>
                  <th>Jumlah Dipakai</th>
                  <th>Cabang Tujuan</th>
                  <th>Tujuan Penggunaan</th>
                  <th>Teknisi / User</th>
                  {!isSupervisor && <th style={{ textAlign: 'center' }}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {checkouts.map((co) => (
                  <tr key={co.id}>
                    <td>{new Date(co.date).toLocaleDateString('id-ID')}</td>
                    <td>
                      <strong>{co.item?.itemName}</strong>
                      <small style={{ fontFamily: 'Space Mono' }}>{co.item?.itemCode}</small>
                    </td>
                    <td><strong style={{ color: '#ef4444' }}>- {co.quantity} Unit</strong></td>
                    <td>{co.branch?.name}</td>
                    <td>{co.notes}</td>
                    <td>{co.user?.name}</td>
                    {!isSupervisor && (
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => handleDelete(co.id)} 
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          title="Batalkan & Kembalikan Stok"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Belum ada transaksi" message="Belum ada catatan barang yang dikeluarkan." />
        )}
      </section>

      {/* MODAL CHECKOUT */}
      {createModal && !isSupervisor && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: '100%', maxWidth: '500px', padding: '24px 32px' }}>
            <button type="button" className="modal-close" onClick={() => setCreateModal(false)}><FiX /></button>
            
            <div style={{ marginBottom: '16px' }}>
              <h2>Keluarkan Barang</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Pilih barang yang akan dipakai. Stok gudang akan otomatis terpotong.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#fff' }}>Pilih Barang (Hanya yang berstok)</label>
                <select 
                  {...register('itemId', { required: true })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                >
                  <option value="">-- Pilih Barang --</option>
                  {items.filter(i => i.stock > 0).map(item => (
                    <option key={item.id} value={item.id}>
                      {item.itemCode} - {item.itemName} (Sisa Stok: {item.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#fff' }}>Tanggal</label>
                  <input 
                    type="date" 
                    {...register('date', { required: true })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff', colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#fff' }}>Jumlah Dipakai</label>
                  <input 
                    type="number" 
                    min="1"
                    {...register('quantity', { required: true })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#fff' }}>Cabang Tujuan</label>
                <select 
                  {...register('branchId', { required: true })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                >
                  <option value="">-- Pilih Cabang --</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: '#fff' }}>Keperluan / Catatan</label>
                <textarea 
                  rows="2" 
                  placeholder="Misal: Pemasangan router baru karena yang lama mati total" 
                  {...register('purpose', { required: true })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                />
              </div>

              <button type="submit" className="primary-button full" style={{ marginTop: '10px', padding: '12px' }}>
                <FiSend /> Proses Pengeluaran Barang
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
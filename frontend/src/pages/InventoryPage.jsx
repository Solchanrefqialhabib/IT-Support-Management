import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiBox, FiEdit2, FiPlus, FiSearch, FiTrash2, FiX, FiEye } from 'react-icons/fi';
import Swal from 'sweetalert2';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import api from '../services/api';
import { useAuth } from '../context/AuthContext'; 

const categoriesList = ['Hardware', 'Network', 'Peripheral', 'Server', 'Lainnya'];
const statusList = ['READY', 'DIPAKAI', 'RUSAK', 'RMA'];

export default function InventoryPage() {
  const { user } = useAuth(); 
  
  // Definisikan hak akses secara tegas
  const isAdmin = user?.role === 'ADMIN';
  const isSupervisor = user?.role === 'SUPERVISOR';
  const isRestrictedRole = !isAdmin; // IT Support dan Supervisor tidak boleh input/edit/hapus aset

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State Modals
  const [createModal, setCreateModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  
  const [editingItem, setEditingItem] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { register, handleSubmit, reset, setValue } = useForm();

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/items');
      setItems(res.data || res);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, background: '#09090b', color: '#fff' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openCreateModal = () => {
    if (isRestrictedRole) return;
    setEditingItem(null);
    reset({
      itemCode: '',
      itemName: '',
      category: 'Hardware',
      stock: 1,
      serialNumber: '',
      status: 'READY'
    });
    setCreateModal(true);
  };

  const openEditModal = (item) => {
    if (isRestrictedRole) return;
    setEditingItem(item);
    setValue('itemCode', item.itemCode);
    setValue('itemName', item.itemName);
    setValue('category', item.category);
    setValue('stock', item.stock);
    setValue('serialNumber', item.serialNumber || '');
    setValue('status', item.status);
    setCreateModal(true);
  };

  // Fungsi untuk membuka pop-up riwayat detail stok
  const openDetailModal = async (id) => {
    try {
      Swal.fire({ title: 'Memuat detail...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), background: '#09090b', color: '#fff' });
      const res = await api.get(`/items/${id}`);
      setSelectedDetail(res.data || res);
      Swal.close();
      setDetailModal(true);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memuat detail riwayat barang.', background: '#09090b', color: '#fff' });
    }
  };

  const onSubmit = async (values) => {
    if (isRestrictedRole) return;
    try {
      const payload = { 
        ...values, 
        stock: Number(values.stock) 
      };

      if (editingItem) {
        await api.put(`/items/${editingItem.id}`, payload);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Aset berhasil diperbarui!', background: '#09090b', color: '#fff', timer: 1500, showConfirmButton: false });
      } else {
        await api.post('/items', payload);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Aset baru berhasil didaftarkan!', background: '#09090b', color: '#fff', timer: 1500, showConfirmButton: false });
      }
      
      setCreateModal(false);
      loadItems();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, background: '#09090b', color: '#fff' });
    }
  };

  const handleDelete = async (id) => {
    if (isRestrictedRole) return;
    Swal.fire({
      title: 'Hapus Aset?',
      text: "Data yang dihapus tidak dapat dikembalikan.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      background: '#09090b', color: '#fff'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/items/${id}`);
          Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Aset berhasil dihapus.', background: '#09090b', color: '#fff', timer: 1200, showConfirmButton: false });
          loadItems();
        } catch (e) {
          Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, background: '#09090b', color: '#fff' });
        }
      }
    });
  };

  const filteredItems = items.filter(item => 
    item.itemCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PageHeader 
        eyebrow="ASSET MANAGEMENT"
        title="Manajemen Aset IT" 
        description="Pantau ketersediaan, penugasan, dan status inventaris perangkat." 
        action={
          // Tombol Tambah Aset HANYA MUNCUL UNTUK ADMIN
          isAdmin && (
            <button className="primary-button" onClick={openCreateModal}>
              <FiPlus /> Tambah Aset
            </button>
          )
        } 
      />

      <section className="panel table-panel">
        <div style={{ padding: '16px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Cari SKU, nama perangkat, serial..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff', fontSize: '13px' }}
            />
          </div>
        </div>

        {loading ? (
          <div className="content-loader">Memuat data inventaris...</div>
        ) : filteredItems.length ? (
          <div className="table-scroll" style={{ marginTop: '12px' }}>
            <table>
              <thead>
                <tr>
                  <th>Kode / SKU</th>
                  <th>Nama Perangkat</th>
                  <th>Kategori</th>
                  <th>Serial Number</th>
                  <th>Stok Saat Ini</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td><code>{item.itemCode}</code></td>
                    <td><strong>{item.itemName}</strong></td>
                    <td>{item.category}</td>
                    <td><small>{item.serialNumber || '-'}</small></td>
                    <td>{item.stock} Unit</td>
                    <td>
                      <span className={`status ${item.status === 'READY' ? 'done' : 'pending'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        
                        {/* Tombol Lihat Detail Riwayat (Bisa diakses semua role) */}
                        <button 
                          onClick={() => openDetailModal(item.id)} 
                          style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer' }}
                          title="Lihat Riwayat Pemakaian"
                        >
                          <FiEye size={18} />
                        </button>

                        {/* Tombol Edit & Hapus HANYA MUNCUL UNTUK ADMIN */}
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => openEditModal(item)} 
                              style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer' }}
                              title="Edit Aset"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id)} 
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                              title="Hapus Aset"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Tidak ada data aset inventaris yang cocok." />
        )}
      </section>

      {/* MODAL DETAIL RIWAYAT STOK */}
      {detailModal && selectedDetail && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: '100%', maxWidth: '600px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button type="button" className="modal-close" onClick={() => setDetailModal(false)}><FiX /></button>
            
            <div style={{ marginBottom: '24px' }}>
              <h2>Detail Riwayat Aset</h2>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
                {selectedDetail.itemCode} — {selectedDetail.itemName}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 600 }}>Sisa Stok di Gudang</span>
                <h3 style={{ margin: '4px 0 0', fontSize: '28px', color: '#fff', fontFamily: 'Space Mono' }}>{selectedDetail.stock} <span style={{fontSize: '14px', color: 'var(--text-muted)'}}>Unit</span></h3>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <span style={{ fontSize: '12px', color: '#f87171', fontWeight: 600 }}>Total Pernah Dipakai</span>
                <h3 style={{ margin: '4px 0 0', fontSize: '28px', color: '#fff', fontFamily: 'Space Mono' }}>
                  {selectedDetail.checkouts?.reduce((sum, co) => sum + co.quantity, 0) || 0} <span style={{fontSize: '14px', color: 'var(--text-muted)'}}>Unit</span>
                </h3>
              </div>
            </div>

            <h4 style={{ color: '#fff', fontSize: '14px', marginBottom: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
              Riwayat Pengeluaran (Checkout)
            </h4>
            {selectedDetail.checkouts?.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                {selectedDetail.checkouts.map(co => (
                  <li key={co.id} style={{ padding: '10px 0', borderBottom: '1px dashed var(--border-light)' }}>
                    <span style={{ color: '#f87171', fontWeight: 'bold' }}>-{co.quantity} Unit</span> dipakai di <strong>{co.branch?.name}</strong> <br/>
                    <small>Pada {new Date(co.date).toLocaleDateString('id-ID')} oleh {co.user?.name}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Belum ada riwayat pengeluaran barang ini ke cabang.</p>
            )}

            <h4 style={{ color: '#fff', fontSize: '14px', marginTop: '24px', marginBottom: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
              Riwayat Pengembalian (Return)
            </h4>
            {selectedDetail.returns?.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                {selectedDetail.returns.map(ret => (
                  <li key={ret.id} style={{ padding: '10px 0', borderBottom: '1px dashed var(--border-light)' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>+ Return</span> dari <strong>{ret.branch?.name}</strong> <br/>
                    <small>Kondisi: {ret.status} | Pada {new Date(ret.date).toLocaleDateString('id-ID')}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Belum ada riwayat pengembalian untuk barang ini.</p>
            )}

          </div>
        </div>
      )}

      {/* MODAL FORM TAMBAH / EDIT ASET (HANYA BISA DIAKSES ADMIN) */}
      {createModal && isAdmin && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: '100%', maxWidth: '520px', padding: '24px 32px' }}>
            <button type="button" className="modal-close" onClick={() => setCreateModal(false)}><FiX /></button>
            
            <div style={{ marginBottom: '16px' }}>
              <h2>{editingItem ? 'Edit Data Aset' : 'Registrasi Aset Baru'}</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                {editingItem ? 'Perbarui informasi spesifikasi perangkat.' : 'Tambahkan perangkat baru ke dalam sistem inventaris.'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Kode Barang / SKU</label>
                <input 
                  type="text" 
                  placeholder="Misal: RT-001" 
                  {...register('itemCode', { required: true })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Nama Perangkat</label>
                <input 
                  type="text" 
                  placeholder="Misal: Router TP-Link" 
                  {...register('itemName', { required: true })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Kategori</label>
                  <select 
                    {...register('category')} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                  >
                    {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Stok Gudang</label>
                  <input 
                    type="number" 
                    min="0" 
                    {...register('stock', { required: true })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Serial Number (Opsional)</label>
                  <input 
                    type="text" 
                    placeholder="Kosongkan jika tidak ada" 
                    {...register('serialNumber')} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Status Aset</label>
                  <select 
                    {...register('status')} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff' }}
                  >
                    {statusList.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="primary-button full" style={{ marginTop: '10px', padding: '12px' }}>
                <FiBox /> Simpan Data Aset
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
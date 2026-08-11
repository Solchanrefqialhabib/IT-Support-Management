import { useState } from 'react';
import { FiDownload, FiMapPin, FiSend, FiRefreshCw } from 'react-icons/fi';
import Swal from 'sweetalert2';
import PageHeader from '../components/PageHeader';
import api from '../services/api';

const today = new Date().toISOString().slice(0, 10);

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [loadingType, setLoadingType] = useState(null);

  const handleDownload = async (type, endpoint, filenamePrefix) => {
    try {
      setLoadingType(type);
      
      const response = await api.get(`/reports/${endpoint}`, {
        params: { startDate, endDate },
        responseType: 'blob' 
      });

      const url = window.URL.createObjectURL(new Blob([response.data || response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filenamePrefix}_${startDate}_sd_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      Swal.fire({
        toast: true, position: 'top-end', icon: 'success',
        title: 'File Excel berhasil diunduh', showConfirmButton: false, timer: 3000
      });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal Ekspor', text: 'Gagal mengunduh laporan dari server.', background: '#09090b', color: '#fff' });
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <>
      <PageHeader 
        eyebrow="DATA EXPORT"
        title="Laporan & Ekspor Excel" 
        description="Pilih rentang tanggal dan jenis data operasional yang ingin Anda unduh." 
      />

      <section className="panel" style={{ padding: '24px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Mulai Tanggal</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff', colorScheme: 'dark' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Sampai Tanggal</label>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: '#fff', colorScheme: 'dark' }}
          />
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        
        {/* Kunjungan */}
        <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px', fontSize: '20px' }}><FiMapPin /></div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Laporan Kunjungan</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Log kendala cabang & uang jalan.</p>
            </div>
          </div>
          <button className="primary-button full" onClick={() => handleDownload('visits', 'visits', 'Laporan_Kunjungan')} disabled={loadingType !== null}>
            {loadingType === 'visits' ? 'Memproses...' : <><FiDownload /> Unduh Excel</>}
          </button>
        </div>

        {/* Pengeluaran */}
        <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '20px' }}><FiSend /></div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Laporan Pengeluaran</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Mutasi keluar perangkat (Checkout).</p>
            </div>
          </div>
          <button className="primary-button full" onClick={() => handleDownload('checkouts', 'checkouts', 'Laporan_Pengeluaran')} disabled={loadingType !== null}>
            {loadingType === 'checkouts' ? 'Memproses...' : <><FiDownload /> Unduh Excel</>}
          </button>
        </div>

        {/* Pengembalian */}
        <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px', fontSize: '20px' }}><FiRefreshCw /></div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Laporan Pengembalian</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Catatan RMA dan aset rusak.</p>
            </div>
          </div>
          <button className="primary-button full" onClick={() => handleDownload('returns', 'returns', 'Laporan_Pengembalian')} disabled={loadingType !== null}>
            {loadingType === 'returns' ? 'Memproses...' : <><FiDownload /> Unduh Excel</>}
          </button>
        </div>

      </div>
    </>
  );
}
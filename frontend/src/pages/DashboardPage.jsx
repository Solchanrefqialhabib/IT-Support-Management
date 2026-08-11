import { useEffect, useState } from 'react';
import { FiActivity, FiCheckCircle, FiClock, FiLayers, FiDollarSign } from 'react-icons/fi';
// KITA UBAH MENJADI BAR CHART AGAR MEMBENTUK LILIN BATANG 
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Swal from 'sweetalert2';
import PageHeader from '../components/PageHeader';
import api from '../services/api';

const currencyFormatter = new Intl.NumberFormat('id-ID', { 
  style: 'currency', 
  currency: 'IDR', 
  maximumFractionDigits: 0 
});

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalVisits: 0,
    completedVisits: 0,
    pendingVisits: 0,
    totalBranches: 0,
    allowanceDynamic: 0 // Sekarang dinamis
  });
  const [trendData, setTrendData] = useState([]);
  const [filterType, setFilterType] = useState('monthly'); // default bulanan
  const [loading, setLoading] = useState(true);

  // Label dinamis untuk judul kotak
  const getFilterTitle = () => {
    if (filterType === 'daily') return 'Hari Ini';
    if (filterType === 'weekly') return 'Minggu Ini';
    if (filterType === 'yearly') return 'Tahun Ini';
    return 'Bulan Ini'; // default monthly
  };

  const loadDashboardData = (type) => {
    Promise.all([
      api.get(`/dashboard?filter=${type}`), // Membawa parameter filter ke Backend
      api.get(`/dashboard/trend-filter?type=${type}`)
    ])
      .then(([resDash, resTrend]) => {
        const dashPayload = resDash.data || resDash;
        const data = dashPayload.data || dashPayload;
        
        setStats({
          totalVisits: data.totalVisits || 0,
          completedVisits: data.completedVisits || 0,
          pendingVisits: data.pendingVisits || 0,
          totalBranches: data.totalBranches || 0,
          allowanceDynamic: data.allowanceDynamic || 0 // Angka uang jalan yang berubah
        });

        const trendPayload = resTrend.data || resTrend;
        const rawTrend = Array.isArray(trendPayload.data) 
          ? trendPayload.data 
          : (Array.isArray(trendPayload) ? trendPayload : []);

        if (rawTrend.length > 0) {
          const formatted = rawTrend.map(item => {
            let labelStr = item.label || item.tanggal || item.month || 'Periode';
            if (type === 'daily' && labelStr.includes('-')) {
              try { labelStr = new Date(labelStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }); } catch (e) { }
            }
            return {
              label: labelStr,
              total: Number(item.total || 0)
            };
          });
          setTrendData(formatted);
        } else if (data.totalVisits > 0) {
          setTrendData([{ label: getFilterTitle(), total: data.totalVisits }]);
        } else {
          setTrendData([]);
        }
      })
      .catch((e) => {
        console.error(e);
        Swal.fire({ icon: 'error', title: 'Gagal memuat data', text: e.message, background: '#09090b', color: '#fff' });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboardData(filterType);
  }, [filterType]);

  if (loading) return <div className="content-loader">Memuat dashboard operasional...</div>;

  return (
    <>
      <PageHeader 
        eyebrow="OVERVIEW"
        title="Dashboard Operasional" 
        description="Ringkasan aktivitas IT Support, tren infrastruktur, dan rekapitulasi anggaran." 
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        <div className="panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '12px', borderRadius: '10px', fontSize: '20px' }}><FiActivity /></div>
          <div>
            {/* Judul dinamis! */}
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Kunjungan {getFilterTitle()}</span>
            <h3 style={{ fontSize: '24px', margin: '2px 0 0', fontFamily: 'Space Mono' }}>{stats.totalVisits}</h3>
          </div>
        </div>

        <div className="panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '12px', borderRadius: '10px', fontSize: '20px' }}><FiCheckCircle /></div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Solved {getFilterTitle()}</span>
            <h3 style={{ fontSize: '24px', margin: '2px 0 0', fontFamily: 'Space Mono' }}>{stats.completedVisits}</h3>
          </div>
        </div>

        <div className="panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '12px', borderRadius: '10px', fontSize: '20px' }}><FiClock /></div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pending {getFilterTitle()}</span>
            <h3 style={{ fontSize: '24px', margin: '2px 0 0', fontFamily: 'Space Mono' }}>{stats.pendingVisits}</h3>
          </div>
        </div>

        <div className="panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '12px', borderRadius: '10px', fontSize: '20px' }}><FiLayers /></div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Semua Cabang</span>
            <h3 style={{ fontSize: '24px', margin: '2px 0 0', fontFamily: 'Space Mono' }}>{stats.totalBranches}</h3>
          </div>
        </div>

        <div className="panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', background: 'linear-gradient(135deg, rgba(31, 78, 120, 0.25), rgba(18, 18, 20, 0.8))', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '12px', borderRadius: '10px', fontSize: '20px' }}><FiDollarSign /></div>
          <div>
            {/* Judul uang jalan dinamis! */}
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Uang Jalan {getFilterTitle()}</span>
            <h3 style={{ fontSize: '18px', margin: '2px 0 0', fontFamily: 'Space Mono', color: '#60a5fa' }}>
              {currencyFormatter.format(stats.allowanceDynamic)}
            </h3>
          </div>
        </div>

      </div>

      <section className="panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>Tren Kunjungan Lapangan</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Analisis frekuensi kunjungan (Filter ini akan mengubah semua perhitungan di atas).</p>
          </div>
          
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-light)', gap: '4px' }}>
            {[
              { id: 'daily', label: 'Harian' },
              { id: 'weekly', label: 'Mingguan' },
              { id: 'monthly', label: 'Bulanan' },
              { id: 'yearly', label: 'Tahunan' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                style={{
                  background: filterType === tab.id ? '#3b82f6' : 'transparent',
                  color: filterType === tab.id ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', height: '300px' }}>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {/* DIUBAH MENJADI BARCHART AGAR MEMBENTUK LILIN BATANG */}
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis dataKey="label" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ 
                    background: '#18181b', 
                    border: '1px solid #27272a', 
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ color: '#3b82f6', fontWeight: 600 }}
                />
                {/* Batang vertikal dengan radius melengkung atas agar elegan */}
                <Bar dataKey="total" name="Jumlah Kunjungan" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '13px' }}>
              Belum ada data tren untuk periode ini.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
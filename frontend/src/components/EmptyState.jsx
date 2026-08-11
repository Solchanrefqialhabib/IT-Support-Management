import { FiInbox } from 'react-icons/fi';

export default function EmptyState({ title = 'Belum ada data', message = 'Belum ada data untuk ditampilkan.' }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <FiInbox />
      </span>
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
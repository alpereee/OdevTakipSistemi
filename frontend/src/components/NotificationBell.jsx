import { useState } from 'react';
import { Bell } from 'lucide-react';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (hasUnread) setHasUnread(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="notification-bell" onClick={toggleDropdown}>
        <Bell size={24} color="var(--text-dark)" />
        {hasUnread && <div className="notification-dot"></div>}
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          width: '300px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          zIndex: 50,
          padding: '1rem'
        }} className="animate-fade-in">
          <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Bildirimler</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>Yeni Ödev Eklendi</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Matematik dersinden yeni bir ödeviniz var.</p>
            </div>
            <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>Sistem Güncellemesi</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Oyunlaştırma (XP) sistemi aktif edildi!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import axios from 'axios';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('https://odevtakipsistemi.onrender.com/api/notifications/my', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = res.data || [];
      setNotifications(data);
      if (data.some(n => n.okundu === 0)) {
        setHasUnread(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleDropdown = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && hasUnread) {
      setHasUnread(false);
      try {
        await axios.post('https://odevtakipsistemi.onrender.com/api/notifications/read', {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setNotifications(notifications.map(n => ({ ...n, okundu: 1 })));
      } catch (e) {}
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="notification-bell" onClick={toggleDropdown} style={{ cursor: 'pointer', position: 'relative' }}>
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
          padding: '1rem',
          maxHeight: '400px',
          overflowY: 'auto'
        }} className="animate-fade-in">
          <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Bildirimler
            <button onClick={() => fetchNotifications()} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.8rem' }}>Yenile</button>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hiç bildiriminiz yok.</p>
            ) : (
                notifications.map(notif => (
                    <div key={notif.id} style={{ padding: '0.5rem', background: notif.okundu === 0 ? '#eff6ff' : '#f8fafc', borderRadius: '8px', borderLeft: notif.okundu === 0 ? '3px solid var(--primary-color)' : 'none' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{notif.baslik}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{notif.icerik}</p>
                      <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem', textAlign: 'right' }}>
                        {new Date(notif.tarih).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

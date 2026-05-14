import { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, BookOpen, Clock, Megaphone, MessageCircle, Send, Trophy, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';

const StudentPanel = () => {
  const [activeTab, setActiveTab] = useState('homeworks');
  const [homeworks, setHomeworks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [msgTo, setMsgTo] = useState('');
  const [msgText, setMsgText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchHomeworks();
    fetchAnnouncements();
    if (activeTab === 'messages') {
      fetchUsers();
      fetchMessages();
    }
  }, [activeTab]);

  const fetchHomeworks = async () => {
    try {
      const res = await axios.get('https://odevtakipsistemi.onrender.com/api/homeworks/student/3', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setHomeworks(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (error) {
      setHomeworks([]);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get('https://odevtakipsistemi.onrender.com/api/announcements', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setAnnouncements(res.data);
    } catch (error) { }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('https://odevtakipsistemi.onrender.com/api/users/recipients', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setUsers(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (e) {
      setUsers([]);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get('https://odevtakipsistemi.onrender.com/api/messages', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setMessages(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (e) {
      setMessages([]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://odevtakipsistemi.onrender.com/api/messages/send', { alici_id: msgTo, mesaj: msgText }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      alert('Mesaj gönderildi'); setMsgText('');
    } catch (e) { alert('Hata'); }
  };

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };

  // Gamification Logic
  const calculateXP = () => {
    let xp = 0;
    homeworks.forEach(hw => {
      if (hw.durum === 'gonderildi') xp += 50;
      if (hw.not_degeri) xp += Math.floor(hw.not_degeri / 10);
    });
    return xp;
  };

  const getBadge = (xp) => {
    if (xp >= 200) return { name: 'Efsane', class: 'badge-gold' };
    if (xp >= 100) return { name: 'Çalışkan', class: 'badge-silver' };
    return { name: 'Çaylak', class: 'badge-bronze' };
  };

  const currentXP = calculateXP();
  const badge = getBadge(currentXP);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* Duyuru Bandı */}
      {announcements.length > 0 && (
        <div style={{ background: 'var(--primary-color)', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Megaphone size={24} />
          <div>
            <strong>Genel Duyuru:</strong> {announcements[0].baslik} - {announcements[0].icerik}
          </div>
        </div>
      )}

      <div className="glass-panel animate-fade-in">
        <div className="dashboard-header">
          <div>
            <h1>Öğrenci Paneli</h1>
            <p className="subtitle">Ödevlerinizi ve mesajlarınızı takip edin.</p>
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className={`gamification-badge ${badge.class}`}>
                <Trophy size={16} /> {badge.name}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                <Star size={16} style={{ verticalAlign: 'middle', color: 'var(--warning)' }} /> {currentXP} XP
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <NotificationBell />
            <button onClick={handleLogout} className="logout-btn"><LogOut size={18} /> Çıkış</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
          <button onClick={() => setActiveTab('homeworks')} className={`btn-primary ${activeTab !== 'homeworks' ? 'outline' : ''}`} style={{ background: activeTab === 'homeworks' ? '' : 'transparent', color: activeTab === 'homeworks' ? '' : 'var(--text-dark)' }}>Ödevlerim</button>
          <button onClick={() => setActiveTab('messages')} className={`btn-primary ${activeTab !== 'messages' ? 'outline' : ''}`} style={{ background: activeTab === 'messages' ? '' : 'transparent', color: activeTab === 'messages' ? '' : 'var(--text-dark)' }}>Mesajlar</button>
        </div>

        {activeTab === 'homeworks' && (
          <div className="animate-fade-in card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}><BookOpen size={20} color="var(--primary-color)" /> Ödev Listesi (Sınıf 1)</h3>
            <div className="table-container">
              <table className="glass-table">
                <thead><tr><th>Ders</th><th>Başlık</th><th>Öğretmen</th><th>Süre</th><th>Teslim</th><th>Durum</th></tr></thead>
                <tbody>
                  {homeworks.map(hw => (
                    <tr key={hw.id} className={hw.durum === 'gonderildi' ? 'row-success' : 'row-danger'}>
                      <td>{hw.ders_adi}</td><td>{hw.baslik}</td><td>{hw.ogretmen_adi}</td>
                      <td><Clock size={14} style={{ verticalAlign: 'middle' }} /> {hw.sure_dakika} dk</td>
                      <td>{hw.teslim_tarihi}</td>
                      <td><span className={`status-badge ${hw.durum === 'gonderildi' ? 'success' : 'danger'}`}>{hw.durum === 'gonderildi' ? 'Gönderildi' : 'Bekliyor'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="animate-fade-in card">
            <h3><MessageCircle size={20} /> Mesajlaşma</h3>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <select className="input-field" value={msgTo} onChange={e => setMsgTo(e.target.value)} required>
                <option value="">Kime...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.role_name})</option>)}
              </select>
              <input type="text" className="input-field" placeholder="Mesajınız..." value={msgText} onChange={e => setMsgText(e.target.value)} required />
              <button type="submit" className="btn-primary" style={{ width: 'auto' }}><Send size={18} /></button>
            </form>

            <h4>Gelen Mesajlar</h4>
            {messages.length === 0 ? <p>Mesajınız yok.</p> : messages.map(m => (
              <div key={m.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.7)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                <strong>{m.gonderen_adi}:</strong> {m.mesaj}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPanel;

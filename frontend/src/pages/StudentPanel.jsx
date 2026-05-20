import { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, BookOpen, Clock, Megaphone, MessageCircle, Send, Trophy, Star, CheckCircle2 } from 'lucide-react';
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
  
  // Submit states
  const [activeHomeworkSubmit, setActiveHomeworkSubmit] = useState(null);
  const [yanitMetni, setYanitMetni] = useState('');

  // User state
  const [currentUser, setCurrentUser] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchMe();
    fetchHomeworks();
    fetchAnnouncements();
    if (activeTab === 'messages') {
      fetchUsers();
      fetchMessages();
    }
  }, [activeTab]);

  const fetchMe = async () => {
      try {
          const res = await axios.get('https://odevtakipsistemi.onrender.com/api/users/me', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          setCurrentUser(res.data);
          if (res.data && res.data.sinif_id) {
              fetchLeaderboard(res.data.sinif_id);
          }
      } catch (e) {
          console.error(e);
      }
  };

  const fetchLeaderboard = async (sinif_id) => {
      try {
          const res = await axios.get(`https://odevtakipsistemi.onrender.com/api/users/leaderboard/${sinif_id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          setLeaderboard(res.data || []);
      } catch (e) { console.error(e); }
  };

  const fetchHomeworks = async () => {
    try {
      const res = await axios.get('https://odevtakipsistemi.onrender.com/api/homeworks/student/my', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
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
      alert('Mesaj gönderildi'); 
      setMsgText('');
      fetchMessages();
    } catch (e) { alert('Hata'); }
  };

  const handleHomeworkSubmit = async (e, odev_id) => {
      e.preventDefault();
      try {
          await axios.post(`https://odevtakipsistemi.onrender.com/api/homeworks/${odev_id}/submit`, 
              { yanit_metni: yanitMetni }, 
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
          );
          alert('Ödev başarıyla teslim edildi! +50 XP kazandınız.');
          setYanitMetni('');
          setActiveHomeworkSubmit(null);
          fetchHomeworks();
          fetchMe(); // Refresh XP
      } catch (e) { alert('Teslim sırasında bir hata oluştu.'); }
  };

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };

  // Gamification Logic (Dynamic from DB)
  const getBadge = (xp) => {
    if (xp >= 500) return { name: 'Efsane 🏆', class: 'badge-gold' };
    if (xp >= 150) return { name: 'Kalfa ⭐', class: 'badge-silver' };
    return { name: 'Çaylak 📚', class: 'badge-bronze' };
  };

  const currentXP = currentUser?.xp || 0;
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
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', minWidth: '200px' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                    <Trophy size={16} color="var(--warning)" /> Sınıf Liderlik Tablosu
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}>
                    {leaderboard.map((lb, index) => (
                        <li key={lb.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: index < 2 ? '1px solid #e2e8f0' : 'none', fontWeight: lb.id === currentUser?.id ? 'bold' : 'normal', color: lb.id === currentUser?.id ? 'var(--primary-color)' : 'inherit' }}>
                            <span>{index + 1}. {lb.username}</span>
                            <span>{lb.xp} XP</span>
                        </li>
                    ))}
                    {leaderboard.length === 0 && <li style={{ color: 'var(--text-muted)' }}>Veri yok</li>}
                </ul>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', height: '100%' }}>
                <NotificationBell />
                <button onClick={handleLogout} className="logout-btn"><LogOut size={18} /> Çıkış</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
          <button onClick={() => setActiveTab('homeworks')} className={`btn-primary ${activeTab !== 'homeworks' ? 'outline' : ''}`} style={{ background: activeTab === 'homeworks' ? '' : 'transparent', color: activeTab === 'homeworks' ? '' : 'var(--text-dark)' }}>Ödevlerim</button>
          <button onClick={() => setActiveTab('messages')} className={`btn-primary ${activeTab !== 'messages' ? 'outline' : ''}`} style={{ background: activeTab === 'messages' ? '' : 'transparent', color: activeTab === 'messages' ? '' : 'var(--text-dark)' }}>Mesajlar</button>
        </div>

        {activeTab === 'homeworks' && (
          <div className="animate-fade-in card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}><BookOpen size={20} color="var(--primary-color)" /> Ödev Listesi</h3>
            <div className="table-container">
              <table className="glass-table">
                <thead><tr><th>Ders</th><th>Başlık</th><th>Öğretmen</th><th>Süre</th><th>Teslim</th><th>Durum</th><th>İşlem</th></tr></thead>
                <tbody>
                  {homeworks.length === 0 ? <tr><td colSpan="7" style={{ textAlign: 'center' }}>Görünecek ödev yok.</td></tr> : homeworks.map(hw => {
                      const isPassed = new Date(hw.teslim_tarihi) < new Date();
                      const isCompleted = hw.durum === 'gonderildi';
                      
                      return (
                        <tr key={hw.id} style={{ borderLeft: isCompleted ? '4px solid #10b981' : (isPassed ? '4px solid #ef4444' : '4px solid #fbbf24'), background: isCompleted ? 'rgba(16, 185, 129, 0.05)' : (isPassed ? 'rgba(239, 68, 68, 0.05)' : 'inherit') }}>
                          <td>{hw.ders_adi}</td><td>{hw.baslik}</td><td>{hw.ogretmen_adi}</td>
                          <td><Clock size={14} style={{ verticalAlign: 'middle' }} /> {hw.EstimatedDuration} dk</td>
                          <td style={{ color: isPassed && !isCompleted ? '#ef4444' : 'inherit' }}>{new Date(hw.teslim_tarihi).toLocaleDateString('tr-TR')}</td>
                          <td><span className={`status-badge ${isCompleted ? 'success' : (isPassed ? 'danger' : 'warning')}`}>{isCompleted ? 'Tamamlandı' : (isPassed ? 'Süresi Geçti' : 'Bekliyor')}</span></td>
                          <td>
                              {!isCompleted && (
                                  <button className="btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }} onClick={() => setActiveHomeworkSubmit(hw.id === activeHomeworkSubmit ? null : hw.id)}>
                                      {activeHomeworkSubmit === hw.id ? 'İptal' : 'Teslim Et'}
                                  </button>
                              )}
                          </td>
                        </tr>
                      );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Submit Form */}
            {activeHomeworkSubmit && (
                <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.8)', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid var(--glass-border)' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle2 size={20} color="var(--primary-color)" /> Yanıtını Gir
                    </h4>
                    <form onSubmit={(e) => handleHomeworkSubmit(e, activeHomeworkSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <textarea 
                            className="input-field" 
                            rows="4" 
                            placeholder="Ödevinizi veya yanıtınızı buraya yazınız..." 
                            value={yanitMetni} 
                            onChange={(e) => setYanitMetni(e.target.value)} 
                            required 
                        />
                        <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>Ödevi Tamamlandı Olarak İşaretle</button>
                    </form>
                </div>
            )}
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

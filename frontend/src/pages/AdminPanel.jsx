import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, Users, UserPlus, Trash2, BookOpen, PlusCircle, CheckCircle2, Megaphone, Settings, Building2 } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users'); // users, lessons, announcements, settings, schools
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const navigate = useNavigate();

  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  // Settings States
  const [schoolName, setSchoolName] = useState('');
  const [educationTerm, setEducationTerm] = useState('');
  const [systemStatus, setSystemStatus] = useState('Aktif');

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'announcements') fetchAnnouncements();
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('https://odevtakipsistemi.onrender.com/api/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setUsers(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (e) { console.error(e); setUsers([]); }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get('https://odevtakipsistemi.onrender.com/api/announcements', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setAnnouncements(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (e) { console.error(e); setAnnouncements([]); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://odevtakipsistemi.onrender.com/api/users', { username, password, role_id: parseInt(roleId) }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      alert('Kullanıcı eklendi');
      fetchUsers();
    } catch (e) { alert('Hata'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Emin misiniz?')) return;
    try {
      await axios.delete(`https://odevtakipsistemi.onrender.com/api/users/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchUsers();
    } catch (e) { alert('Hata'); }
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://odevtakipsistemi.onrender.com/api/announcements', { baslik: annTitle, icerik: annContent }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      alert('Duyuru yayınlandı');
      setAnnTitle(''); setAnnContent('');
      fetchAnnouncements();
    } catch (e) { alert('Hata'); }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await axios.delete(`https://odevtakipsistemi.onrender.com/api/announcements/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchAnnouncements();
    } catch (e) { alert('Hata'); }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get('https://odevtakipsistemi.onrender.com/api/settings', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (res.data) {
        setSchoolName(res.data.school_name || '');
        setEducationTerm(res.data.education_term || '');
        setSystemStatus(res.data.system_status || 'Aktif');
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://odevtakipsistemi.onrender.com/api/settings', {
        school_name: schoolName,
        education_term: educationTerm,
        system_status: systemStatus
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      alert('Ayarlar başarıyla kaydedildi!');
    } catch (e) { alert('Ayarlar kaydedilirken hata oluştu.'); }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div className="glass-panel animate-fade-in" style={{ marginBottom: '2rem' }}>
        <div className="dashboard-header">
          <div>
            <h1>Yönetici Paneli</h1>
            <p className="subtitle">Sistem yapılandırması ve kullanıcı yönetimi</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <NotificationBell />
            <button onClick={handleLogout} className="logout-btn"><LogOut size={18} /> Çıkış</button>
          </div>
        </div>

        {/* Sekmeler */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('users')} className={`btn-primary ${activeTab !== 'users' ? 'outline' : ''}`} style={{ background: activeTab === 'users' ? '' : 'transparent', color: activeTab === 'users' ? '' : 'var(--text-dark)' }}>Kullanıcılar</button>
          <button onClick={() => setActiveTab('announcements')} className={`btn-primary ${activeTab !== 'announcements' ? 'outline' : ''}`} style={{ background: activeTab === 'announcements' ? '' : 'transparent', color: activeTab === 'announcements' ? '' : 'var(--text-dark)' }}>Duyurular</button>
          <button onClick={() => setActiveTab('settings')} className={`btn-primary ${activeTab !== 'settings' ? 'outline' : ''}`} style={{ background: activeTab === 'settings' ? '' : 'transparent', color: activeTab === 'settings' ? '' : 'var(--text-dark)' }}>Ayarlar</button>
        </div>

        {activeTab === 'users' && (
          <div className="animate-fade-in card">
            <h3><Users size={20} /> Kullanıcı Ekle</h3>
            <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <input type="text" placeholder="Kullanıcı Adı" className="input-field" value={username} onChange={e => setUsername(e.target.value)} required />
              <input type="password" placeholder="Şifre" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required />
              <select className="input-field" value={roleId} onChange={e => setRoleId(e.target.value)} required>
                <option value="">Rol Seç</option>
                <option value="1">Yönetici</option><option value="2">Öğretmen</option><option value="3">Öğrenci</option><option value="4">Veli</option>
              </select>
              <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Ekle</button>
            </form>

            <table className="glass-table">
              <thead><tr><th>ID</th><th>Kullanıcı Adı</th><th>Rol</th><th>İşlem</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td><td>{u.username}</td><td>{u.role_name}</td>
                    <td><button onClick={() => handleDeleteUser(u.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="animate-fade-in card">
            <h3><Megaphone size={20} /> Genel Duyuru Yayınla</h3>
            <form onSubmit={handleAddAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <input type="text" placeholder="Duyuru Başlığı" className="input-field" value={annTitle} onChange={e => setAnnTitle(e.target.value)} required />
              <textarea placeholder="Duyuru İçeriği..." className="input-field" rows="3" value={annContent} onChange={e => setAnnContent(e.target.value)} required></textarea>
              <button type="submit" className="btn-primary" style={{ width: '200px' }}>Yayınla</button>
            </form>

            <h4>Mevcut Duyurular</h4>
            {announcements.map(a => (
              <div key={a.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px', marginBottom: '1rem', position: 'relative' }}>
                <button onClick={() => handleDeleteAnnouncement(a.id)} style={{ position: 'absolute', right: '1rem', top: '1rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                <h5>{a.baslik}</h5>
                <p>{a.icerik}</p>
                <small style={{ color: 'var(--text-muted)' }}>{new Date(a.tarih).toLocaleString('tr-TR')} - Yazan: {a.yayinlayan_adi}</small>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-fade-in card">
            <h3><Settings size={20} /> Genel Yapılandırmalar</h3>
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', maxWidth: '500px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Okul Adı</label>
                <input type="text" className="input-field" value={schoolName} onChange={e => setSchoolName(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Eğitim Dönemi (Örn: 2025-2026)</label>
                <input type="text" className="input-field" value={educationTerm} onChange={e => setEducationTerm(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Sistem Durumu</label>
                <select className="input-field" value={systemStatus} onChange={e => setSystemStatus(e.target.value)} required>
                  <option value="Aktif">Aktif</option>
                  <option value="Bakımda">Bakımda</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Kaydet</button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminPanel;

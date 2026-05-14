import { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, AlertTriangle, PlusCircle, CheckCircle2, GraduationCap, Star, CalendarDays, BarChart3, MessageCircle, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import NotificationBell from '../components/NotificationBell';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const TeacherPanel = () => {
  const [activeTab, setActiveTab] = useState('homeworks'); // homeworks, analytics, messages

  const [warning, setWarning] = useState('');
  const [totalLoad, setTotalLoad] = useState(0);
  const [homeworks, setHomeworks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeHomework, setActiveHomework] = useState(null);
  const [gradeData, setGradeData] = useState({});
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [msgTo, setMsgTo] = useState('');

  // Form States
  const [showForm, setShowForm] = useState(false);
  const [baslik, setBaslik] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [sureDakika, setSureDakika] = useState('');
  const [teslimTarihi, setTeslimTarihi] = useState('');
  const [dosya, setDosya] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHomeworks();
    checkHomeworkLoad();
    if (activeTab === 'messages') {
      fetchUsers();
      fetchMessages();
    }
  }, [activeTab]);

  const fetchHomeworks = async () => {
    try {
      const res = await axios.get('https://odevtakipsistemi.onrender.com/api/homeworks/class/1', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setHomeworks(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (e) {
      setHomeworks([]);
    }
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

  const checkHomeworkLoad = async () => {
    try {
      const res = await axios.get('https://odevtakipsistemi.onrender.com/api/analytics/homework-load?sinif_id=1', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setTotalLoad(res.data.toplam_sure_dakika);
      setWarning(res.data.warning || '');
    } catch (e) { }
  };

  const fetchSubmissions = async (id) => {
    try {
      const res = await axios.get(`https://odevtakipsistemi.onrender.com/api/homeworks/${id}/submissions`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setSubmissions(data);
      setActiveHomework(id);
      const initGrades = {};
      data.forEach(s => initGrades[s.id] = { not_degeri: s.not_degeri || '', ogretmen_notu: s.ogretmen_notu || '' });
      setGradeData(initGrades);
    } catch (e) {
      setSubmissions([]);
    }
  };

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };

  const handleHomeworkSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const fd = new FormData();
    fd.append('ders_id', 1); fd.append('sinif_id', 1); fd.append('baslik', baslik);
    fd.append('aciklama', aciklama); fd.append('sure_dakika', sureDakika); fd.append('teslim_tarihi', teslimTarihi);
    if (dosya) fd.append('dosya', dosya);

    try {
      await axios.post('https://odevtakipsistemi.onrender.com/api/homeworks', fd, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        } 
      });
      alert('Ödev eklendi'); setShowForm(false); fetchHomeworks(); checkHomeworkLoad();
    } catch (e) { alert('Hata'); }
  };

  const handleGradeSubmit = async (id) => {
    try {
      await axios.put(`https://odevtakipsistemi.onrender.com/api/homeworks/submissions/${id}/grade`, { not_degeri: gradeData[id].not_degeri, ogretmen_notu: gradeData[id].ogretmen_notu }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      alert('Not kaydedildi.');
    } catch (e) { alert('Hata'); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://odevtakipsistemi.onrender.com/api/messages/send', { alici_id: msgTo, mesaj: msgText }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      alert('Mesaj gönderildi'); setMsgText('');
    } catch (e) { alert('Hata'); }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Ogrenciler ve Not Durumu", 14, 15);
    const tableData = submissions.map(s => [s.ogrenci_adi, s.not_degeri || '-', s.ogretmen_notu || '-']);
    doc.autoTable({
      head: [['Ogrenci', 'Not', 'Geri Bildirim']],
      body: tableData,
      startY: 20
    });
    doc.save('notlar.pdf');
  };

  const exportExcel = () => {
    const data = submissions.map(s => ({
      Ogrenci: s.ogrenci_adi,
      Not: s.not_degeri || '-',
      Geri_Bildirim: s.ogretmen_notu || '-'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notlar");
    XLSX.writeFile(wb, "notlar.xlsx");
  };

  // Mock data for charts
  const chartData = [
    { name: 'Pzt', Yük: 45 }, { name: 'Sal', Yük: 65 }, { name: 'Çar', Yük: 30 },
    { name: 'Per', Yük: totalLoad }, { name: 'Cum', Yük: 0 }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {warning && (
        <div className="warning-banner animate-fade-in"><AlertTriangle size={24} /> DİKKAT: Yüksek Ödev Yükü ({totalLoad} dk)</div>
      )}

      <div className="glass-panel animate-fade-in" style={{ marginBottom: '2rem' }}>
        <div className="dashboard-header">
          <div><h1>Öğretmen Paneli</h1><p className="subtitle">Sınıflar, Ödevler ve İletişim</p></div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <NotificationBell />
            <button onClick={handleLogout} className="logout-btn"><LogOut size={18} /> Çıkış</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
          <button onClick={() => setActiveTab('homeworks')} className={`btn-primary ${activeTab !== 'homeworks' ? 'outline' : ''}`} style={{ background: activeTab === 'homeworks' ? '' : 'transparent', color: activeTab === 'homeworks' ? '' : 'var(--text-dark)' }}>Ödev & Notlandırma</button>
          <button onClick={() => setActiveTab('analytics')} className={`btn-primary ${activeTab !== 'analytics' ? 'outline' : ''}`} style={{ background: activeTab === 'analytics' ? '' : 'transparent', color: activeTab === 'analytics' ? '' : 'var(--text-dark)' }}>Analiz & Takvim</button>
          <button onClick={() => setActiveTab('messages')} className={`btn-primary ${activeTab !== 'messages' ? 'outline' : ''}`} style={{ background: activeTab === 'messages' ? '' : 'transparent', color: activeTab === 'messages' ? '' : 'var(--text-dark)' }}>Mesajlar</button>
        </div>

        {activeTab === 'homeworks' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3><GraduationCap size={20} style={{ verticalAlign: 'middle' }} /> Verilen Ödevler</h3>
              <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowForm(!showForm)}>Yeni Ödev Ata</button>
            </div>

            {showForm && (
              <form onSubmit={handleHomeworkSubmit} style={{ background: 'rgba(255,255,255,0.4)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <input type="text" className="input-field" placeholder="Başlık" value={baslik} onChange={e => setBaslik(e.target.value)} required />
                <textarea className="input-field" placeholder="Açıklama" value={aciklama} onChange={e => setAciklama(e.target.value)} required />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input type="number" className="input-field" placeholder="Süre (Dk)" value={sureDakika} onChange={e => setSureDakika(e.target.value)} required />
                  <input type="date" className="input-field" value={teslimTarihi} onChange={e => setTeslimTarihi(e.target.value)} required />
                </div>
                <input type="file" onChange={e => setDosya(e.target.files[0])} style={{ margin: '1rem 0' }} />
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Gönder</button>
              </form>
            )}

            <table className="glass-table">
              <thead><tr><th>Başlık</th><th>Süre</th><th>Teslim Tarihi</th><th>İşlem</th></tr></thead>
              <tbody>
                {homeworks.map(h => (
                  <tr key={h.id}>
                    <td>{h.baslik}</td><td>{h.sure_dakika} dk</td><td>{h.teslim_tarihi}</td>
                    <td><button className="btn-primary" style={{ width: 'auto', padding: '0.4rem 1rem' }} onClick={() => fetchSubmissions(h.id)}>Teslimler</button></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {activeHomework && (
              <div className="card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4>Teslimler (Notlandırma)</h4>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-primary outline" style={{ width: 'auto', padding: '0.4rem 1rem' }} onClick={exportPDF}>PDF İndir</button>
                    <button className="btn-primary outline" style={{ width: 'auto', padding: '0.4rem 1rem' }} onClick={exportExcel}>Excel İndir</button>
                  </div>
                </div>
                {submissions.length === 0 ? <p>Teslim yok.</p> : (
                  <table className="glass-table" style={{ background: 'transparent' }}>
                    <thead><tr><th>Öğrenci</th><th>Not</th><th>Geri Bildirim</th><th>Kaydet</th></tr></thead>
                    <tbody>
                      {submissions.map(s => (
                        <tr key={s.id}>
                          <td>{s.ogrenci_adi}</td>
                          <td><input type="number" className="input-field" value={gradeData[s.id]?.not_degeri} onChange={e => setGradeData({ ...gradeData, [s.id]: { ...gradeData[s.id], not_degeri: e.target.value } })} style={{ width: '80px' }} /></td>
                          <td><input type="text" className="input-field" value={gradeData[s.id]?.ogretmen_notu} onChange={e => setGradeData({ ...gradeData, [s.id]: { ...gradeData[s.id], ogretmen_notu: e.target.value } })} /></td>
                          <td><button className="btn-primary" style={{ width: 'auto' }} onClick={() => handleGradeSubmit(s.id)}>Ver</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="animate-fade-in dashboard-grid">
            <div className="card">
              <h3><BarChart3 size={20} /> Haftalık Ödev Yükü (Dakika)</h3>
              <div style={{ height: '300px', marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="Yük" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3><CalendarDays size={20} /> Basit Ödev Takvimi</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => <div key={d} style={{ textAlign: 'center', fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{d}</div>)}
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} style={{ padding: '0.5rem', background: i === 3 ? 'var(--danger)' : '#f8fafc', color: i === 3 ? 'white' : 'inherit', borderRadius: '8px', minHeight: '60px', display: 'flex', flexDirection: 'column', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: '500' }}>{i + 1}</span>
                    {i === 3 && <div style={{ fontSize: '0.7rem', marginTop: 'auto', background: 'rgba(0,0,0,0.2)', padding: '2px 4px', borderRadius: '4px' }}>Matematik</div>}
                  </div>
                ))}
              </div>
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
                <strong>{m.gonderen_adi}:</strong> {m.mesaj} <span style={{ float: 'right', fontSize: '0.8rem', color: 'gray' }}>{new Date(m.tarih).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default TeacherPanel;

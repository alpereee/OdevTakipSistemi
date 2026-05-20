import { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, AlertTriangle, PlusCircle, CheckCircle2, GraduationCap, Star, CalendarDays, BarChart3, MessageCircle, Send, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import NotificationBell from '../components/NotificationBell';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const TeacherPanel = () => {
  const [activeTab, setActiveTab] = useState('homeworks'); // homeworks, analytics, messages, classes

  const [warning, setWarning] = useState('');
  const [highLoadError, setHighLoadError] = useState('');
  const [totalLoad, setTotalLoad] = useState(0);
  const [homeworks, setHomeworks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeHomework, setActiveHomework] = useState(null);
  const [gradeData, setGradeData] = useState({});
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [classes, setClasses] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [msgTo, setMsgTo] = useState('');

  // Form States
  const [showForm, setShowForm] = useState(false);
  const [baslik, setBaslik] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [teslimTarihi, setTeslimTarihi] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('1'); // Default or selected class
  const [newClassName, setNewClassName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
    fetchHomeworks();
    if (activeTab === 'messages') {
      fetchUsers();
      fetchMessages();
    }
  }, [activeTab]);

  useEffect(() => {
      if(selectedClassId && teslimTarihi) {
          checkHomeworkLoad(selectedClassId, teslimTarihi);
      }
  }, [selectedClassId, teslimTarihi]);

  const fetchClasses = async () => {
      try {
          const res = await axios.get('https://odevtakipsistemi.onrender.com/api/classes', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          setClasses(Array.isArray(res.data) ? res.data : (res.data?.data || []));
      } catch (e) {
          setClasses([]);
      }
  };

  const handleAddClass = async (e) => {
      e.preventDefault();
      try {
          await axios.post('https://odevtakipsistemi.onrender.com/api/classes', { ad: newClassName }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          alert('Sınıf başarıyla eklendi.');
          setNewClassName('');
          fetchClasses();
      } catch(e) { alert('Hata'); }
  };

  const fetchHomeworks = async () => {
    try {
      const res = await axios.get(`https://odevtakipsistemi.onrender.com/api/homeworks/class/${selectedClassId || 1}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
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

  const checkHomeworkLoad = async (sinif_id, tarih) => {
    try {
      const url = `https://odevtakipsistemi.onrender.com/api/analytics/homework-load?sinif_id=${sinif_id}${tarih ? `&tarih=${tarih}` : ''}`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
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
    setHighLoadError('');
    const token = localStorage.getItem('token');
    
    // Sınıf ID 1 varsayılıyor test için ama classes entegrasyonu varsa dinamik seçilebilir.
    const payload = {
        ders_id: 1, 
        sinif_id: selectedClassId || 1, 
        baslik,
        aciklama, 
        EstimatedDuration: estimatedDuration, 
        teslim_tarihi: teslimTarihi
    };

    try {
      await axios.post('https://odevtakipsistemi.onrender.com/api/homeworks', payload, { 
        headers: { 
          Authorization: `Bearer ${token}`
        } 
      });
      alert('Ödev eklendi'); setShowForm(false); fetchHomeworks(); checkHomeworkLoad(selectedClassId || 1, teslimTarihi);
    } catch (e) { 
        if (e.response && e.response.status === 400 && e.response.data.warning) {
            setHighLoadError(e.response.data.warning);
        } else {
            alert('Hata oluştu'); 
        }
    }
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
      
      {/* High Load Error Toast */}
      {highLoadError && (
          <div className="animate-fade-in" style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <AlertTriangle size={24} color="#ef4444" />
              <div>
                  <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '4px' }}>Yüksek Ödev Yükü Uyarı Logu</strong>
                  {highLoadError}
              </div>
          </div>
      )}

      {warning && !highLoadError && (
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

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('classes')} className={`btn-primary ${activeTab !== 'classes' ? 'outline' : ''}`} style={{ background: activeTab === 'classes' ? '' : 'transparent', color: activeTab === 'classes' ? '' : 'var(--text-dark)' }}>Sınıflarım</button>
          <button onClick={() => setActiveTab('homeworks')} className={`btn-primary ${activeTab !== 'homeworks' ? 'outline' : ''}`} style={{ background: activeTab === 'homeworks' ? '' : 'transparent', color: activeTab === 'homeworks' ? '' : 'var(--text-dark)' }}>Ödev & Notlandırma</button>
          <button onClick={() => setActiveTab('analytics')} className={`btn-primary ${activeTab !== 'analytics' ? 'outline' : ''}`} style={{ background: activeTab === 'analytics' ? '' : 'transparent', color: activeTab === 'analytics' ? '' : 'var(--text-dark)' }}>Analiz & Takvim</button>
          <button onClick={() => setActiveTab('messages')} className={`btn-primary ${activeTab !== 'messages' ? 'outline' : ''}`} style={{ background: activeTab === 'messages' ? '' : 'transparent', color: activeTab === 'messages' ? '' : 'var(--text-dark)' }}>Mesajlar</button>
        </div>

        {activeTab === 'classes' && (
            <div className="animate-fade-in card">
                <h3><Users size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Sınıflarım</h3>
                <form onSubmit={handleAddClass} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <input type="text" className="input-field" placeholder="Yeni Sınıf Adı (Örn: 9-A)" value={newClassName} onChange={e => setNewClassName(e.target.value)} required />
                    <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Yeni Sınıf Ekle</button>
                </form>
                <table className="glass-table">
                    <thead><tr><th>ID</th><th>Sınıf Adı</th></tr></thead>
                    <tbody>
                        {classes.length === 0 ? <tr><td colSpan="2">Sınıf bulunamadı.</td></tr> : classes.map(c => (
                            <tr key={c.id}><td>{c.id}</td><td>{c.ad}</td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === 'homeworks' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
              <h3><GraduationCap size={20} style={{ verticalAlign: 'middle' }} /> Verilen Ödevler</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <select className="input-field" style={{ width: 'auto', margin: 0, padding: '0.4rem 1rem' }} value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); fetchHomeworks(); }}>
                      <option value="1">Sınıf Seçin (Varsayılan: 1)</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.ad}</option>)}
                  </select>
                  <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowForm(!showForm)}>Yeni Ödev Ata</button>
              </div>
            </div>

            {showForm && (
              <div style={{ background: 'rgba(255,255,255,0.6)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, color: 'var(--text-dark)' }}>Yeni Ödev Detayları</h4>
                      <div style={{ background: totalLoad > 90 ? 'var(--warning)' : '#e2e8f0', color: totalLoad > 90 ? 'white' : 'var(--text-dark)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '500' }}>
                          Sınıfın O Günkü Ödev Yükü: {totalLoad} dk
                      </div>
                  </div>
                  <form onSubmit={handleHomeworkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input type="text" className="input-field" placeholder="Başlık" value={baslik} onChange={e => setBaslik(e.target.value)} required />
                    <textarea className="input-field" placeholder="Açıklama" value={aciklama} onChange={e => setAciklama(e.target.value)} required />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Tahmini Süre (Dk) *</label>
                            <input type="number" className="input-field" placeholder="Süre (Dk)" value={estimatedDuration} onChange={e => setEstimatedDuration(e.target.value)} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Teslim Tarihi *</label>
                            <input type="date" className="input-field" value={teslimTarihi} onChange={e => setTeslimTarihi(e.target.value)} required />
                        </div>
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '200px', alignSelf: 'flex-end' }}>Gönder</button>
                  </form>
              </div>
            )}

            <table className="glass-table">
              <thead><tr><th>Başlık</th><th>Süre</th><th>Teslim Tarihi</th><th>İşlem</th></tr></thead>
              <tbody>
                {homeworks.map(h => {
                    const isPassed = new Date(h.teslim_tarihi) < new Date();
                    return (
                      <tr key={h.id} style={{ borderLeft: isPassed ? '4px solid #ef4444' : '4px solid #10b981' }}>
                        <td>{h.baslik}</td><td>{h.EstimatedDuration} dk</td>
                        <td style={{ color: isPassed ? '#ef4444' : 'inherit' }}>{new Date(h.teslim_tarihi).toLocaleDateString('tr-TR')}</td>
                        <td><button className="btn-primary" style={{ width: 'auto', padding: '0.4rem 1rem' }} onClick={() => fetchSubmissions(h.id)}>Teslimler</button></td>
                      </tr>
                    );
                })}
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
                    <thead><tr><th>Öğrenci</th><th>Öğrenci Yanıtı</th><th>Not</th><th>Geri Bildirim</th><th>Kaydet</th></tr></thead>
                    <tbody>
                      {submissions.map(s => (
                        <tr key={s.id} style={{ borderLeft: '4px solid #10b981' }}>
                          <td>{s.ogrenci_adi}</td>
                          <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.yanit_metni}>{s.yanit_metni || '-'}</td>
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
                  <div key={i} style={{ padding: '0.5rem', background: i === 3 ? '#fbbf24' : '#f8fafc', color: i === 3 ? 'white' : 'inherit', borderRadius: '8px', minHeight: '60px', display: 'flex', flexDirection: 'column', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: '500' }}>{i + 1}</span>
                    {i === 3 && <div style={{ fontSize: '0.7rem', marginTop: 'auto', background: 'rgba(0,0,0,0.2)', padding: '2px 4px', borderRadius: '4px' }}>Yaklaşan Teslim</div>}
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

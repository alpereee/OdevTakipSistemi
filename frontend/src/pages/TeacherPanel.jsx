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
  
  // Student & Attendance States
  const [allStudents, setAllStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({});

  // Form States
  const [showForm, setShowForm] = useState(false);
  const [baslik, setBaslik] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [teslimTarihi, setTeslimTarihi] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('1'); // Default or selected class
  const [newClassName, setNewClassName] = useState('');
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
    fetchAllStudents();
    if (activeTab === 'messages') {
      fetchUsers();
      fetchMessages();
    }
  }, [activeTab]);

  // selectedClassId değişince ödevleri ve öğrencileri yeniden getir
  useEffect(() => {
    if (selectedClassId) {
      fetchHomeworks(selectedClassId); // Stale closure olmaması için ID argüman geç
      fetchAllStudents();
    }
  }, [selectedClassId]);

  // Aktif ödev seçince teslim listesini getir
  useEffect(() => {
    if (activeHomework) {
      fetchSubmissions(activeHomework);
    }
  }, [activeHomework]);

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

  const fetchAllStudents = async () => {
      try {
          const res = await axios.get('https://odevtakipsistemi.onrender.com/api/users/students', {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          const data = Array.isArray(res.data) ? res.data : [];
          // sinif_id'yi her zaman Number'a normalize et (tip uyuşmazlığını engelle)
          setAllStudents(data.map(s => ({ ...s, sinif_id: s.sinif_id != null ? Number(s.sinif_id) : null })));
      } catch (e) {
          console.error('Öğrenci listesi çekilemedi:', e.response?.data || e.message);
          setAllStudents([]);
      }
  };

  const handleAssignClass = async (studentId, sinif_id) => {
      try {
          await axios.put(`https://odevtakipsistemi.onrender.com/api/users/${studentId}/class`, { sinif_id }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          // Optimistic UI: state'i aninda guncelle, refetch bekleme
          setAllStudents(prev => prev.map(s =>
              s.id === parseInt(studentId) ? { ...s, sinif_id: sinif_id ? parseInt(sinif_id) : null } : s
          ));
      } catch (e) { alert('Öğrenci sınıfı güncellenemedi.'); }
  };

  const handleBatchAttendance = async (e) => {
      e.preventDefault();
      const records = Object.keys(attendanceData).map(studentId => ({
          ogrenci_id: studentId,
          durum: attendanceData[studentId]
      }));
      if (records.length === 0) return alert('Lütfen en az bir öğrencinin yoklamasını girin.');
      
      try {
          await axios.post('https://odevtakipsistemi.onrender.com/api/attendance/batch', { records, tarih: attendanceDate }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          alert('Yoklama başarıyla kaydedildi.');
          setAttendanceData({});
      } catch (e) { alert('Yoklama kaydedilemedi.'); }
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

  // fetchHomeworks sinif_id parametresini argüman olarak alır (stale closure önlenir)
  const fetchHomeworks = async (classId) => {
    const id = classId || selectedClassId || '1';
    try {
      const res = await axios.get(`https://odevtakipsistemi.onrender.com/api/homeworks/class/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setHomeworks(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Ödevler çekilemedi:', e.response?.data || e.message);
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
        sinif_id: selectedClassId,
        baslik,
        aciklama,
        EstimatedDuration: Number(estimatedDuration),
        teslim_tarihi: teslimTarihi
    };

    try {
      await axios.post('https://odevtakipsistemi.onrender.com/api/homeworks', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Ödev eklendi!');
      setShowForm(false);
      setBaslik(''); setAciklama(''); setEstimatedDuration(''); setTeslimTarihi('');
      fetchHomeworks(selectedClassId); // Stale closure'ı önlemek için ID'yi argüman geç
      checkHomeworkLoad(selectedClassId, teslimTarihi);
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
      alert('Mesaj gönderildi'); 
      setMsgText('');
      fetchMessages();
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

  const calculatePerformance = () => {
    if (homeworks.length === 0) return 0;
    const completed = homeworks.filter(h => h.durum === 'gonderildi').length;
    return Math.round((completed / homeworks.length) * 100);
  };
  const performanceRate = calculatePerformance();

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
                <h3><Users size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Sınıflarım & Öğrenci Yönetimi</h3>
                
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '300px' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Sınıflar</h4>
                        <form onSubmit={handleAddClass} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <input type="text" className="input-field" placeholder="Yeni Sınıf Adı (Örn: 9-A)" value={newClassName} onChange={e => setNewClassName(e.target.value)} required />
                            <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Yeni Ekle</button>
                        </form>
                        <table className="glass-table">
                            <thead><tr><th>Sınıf Seç</th><th>ID</th><th>Sınıf Adı</th></tr></thead>
                            <tbody>
                                {classes.length === 0 ? <tr><td colSpan="3">Sınıf bulunamadı.</td></tr> : classes.map(c => (
                                    <tr key={c.id} style={{ background: selectedClassId === c.id.toString() ? 'rgba(99, 102, 241, 0.1)' : 'transparent' }}>
                                        <td>
                                            <input type="radio" name="classSelect" checked={selectedClassId === c.id.toString()} onChange={() => setSelectedClassId(c.id.toString())} />
                                        </td>
                                        <td>{c.id}</td><td>{c.ad}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ flex: '2', minWidth: '400px' }}>
                        <h4 style={{ marginBottom: '0.75rem' }}>
                            Sınıf: <strong>{classes.find(c => c.id.toString() === selectedClassId)?.ad || 'Seçilmedi'}</strong> — Öğrenci Yönetimi
                        </h4>
                        
                        {/* Öğrenci Ekleme Dropdown */}
                        <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <select
                                className="input-field"
                                style={{ margin: 0, flex: 1 }}
                                value={selectedStudentToAdd}
                                onChange={e => setSelectedStudentToAdd(e.target.value)}
                            >
                                <option value="">-- Eklenecek öğrenci seçin --</option>
                                {allStudents.filter(s => !s.sinif_id || String(s.sinif_id) !== String(selectedClassId)).map(s => (
                                    <option key={s.id} value={s.id}>{s.username} {s.sinif_id ? `(Bk. Sınıf ${s.sinif_id})` : '(Boşta)'}</option>
                                ))}
                            </select>
                            <button
                                className="btn-primary"
                                style={{ width: 'auto', whiteSpace: 'nowrap' }}
                                disabled={!selectedStudentToAdd}
                                onClick={async () => {
                                    if (!selectedStudentToAdd) return;
                                    await handleAssignClass(selectedStudentToAdd, selectedClassId);
                                    setSelectedStudentToAdd('');
                                }}
                            >
                                Bu Sınıfa Ekle
                            </button>
                        </div>

                        {/* Toplu Yoklama */}
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            <form onSubmit={handleBatchAttendance} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <label style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>Yoklama Tarihi:</label>
                                <input type="date" className="input-field" style={{ width: 'auto', margin: 0 }} value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} required />
                                <button type="submit" className="btn-primary" style={{ width: 'auto', background: '#ef4444', whiteSpace: 'nowrap' }}>Toplu Kaydet</button>
                            </form>
                        </div>

                        {/* Sadece seçili sınıftaki öğrenciler */}
                        {(() => {
                            const classStudents = allStudents.filter(s => s.sinif_id?.toString() === selectedClassId);
                            return (
                                <table className="glass-table">
                                    <thead>
                                        <tr>
                                            <th>Öğrenci Adı</th>
                                            <th>Yoklama</th>
                                            <th>Sınıftan Çıkar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classStudents.length === 0 ? (
                                            <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Bu sınıfta öğrenci yok. Yukarıdan ekleyin.</td></tr>
                                        ) : classStudents.map(student => (
                                            <tr key={student.id}>
                                                <td><strong>{student.username}</strong></td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                            <input type="radio" name={`att_${student.id}`} onChange={() => setAttendanceData({...attendanceData, [student.id]: 'Geldi'})} checked={attendanceData[student.id] === 'Geldi'} /> Geldi
                                                        </label>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                            <input type="radio" name={`att_${student.id}`} onChange={() => setAttendanceData({...attendanceData, [student.id]: 'Gelmedi'})} checked={attendanceData[student.id] === 'Gelmedi'} /> Gelmedi
                                                        </label>
                                                    </div>
                                                </td>
                                                <td>
                                                    <button
                                                        style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', padding: '0.2rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}
                                                        onClick={() => handleAssignClass(student.id, null)}
                                                    >
                                                        Çıkar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            );
                        })()}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'homeworks' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
              <h3><GraduationCap size={20} style={{ verticalAlign: 'middle' }} /> Verilen Ödevler</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <select
                      className="input-field"
                      style={{ width: 'auto', margin: 0, padding: '0.4rem 1rem' }}
                      value={selectedClassId}
                      onChange={e => {
                          setSelectedClassId(e.target.value);
                          setActiveHomework(null); // Sınıf değişince açık teslim listesini kapat
                      }}
                  >
                      {classes.length === 0 && <option value="1">Yükleniyor...</option>}
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
              <thead><tr><th>Başlık</th><th>Ders</th><th>Süre</th><th>Teslim Tarihi</th><th>Teslimler</th></tr></thead>
              <tbody>
                {homeworks.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    Seçili sınıfa atanmış ödev bulunamadı.
                  </td></tr>
                ) : homeworks.map(h => {
                    const isPassed = new Date(h.teslim_tarihi) < new Date();
                    const isActive = activeHomework === h.id;
                    return (
                      <tr key={h.id} style={{ borderLeft: isPassed ? '4px solid #ef4444' : '4px solid #10b981', cursor: 'pointer', background: isActive ? 'rgba(99,102,241,0.05)' : 'transparent' }}>
                        <td><strong>{h.baslik}</strong></td>
                        <td>{h.ders_adi}</td>
                        <td>{h.EstimatedDuration} dk</td>
                        <td style={{ color: isPassed ? '#ef4444' : 'inherit' }}>{new Date(h.teslim_tarihi).toLocaleDateString('tr-TR')}</td>
                        <td>
                          <button
                            className="btn-primary"
                            style={{ width: 'auto', padding: '0.4rem 1rem', background: isActive ? '#94a3b8' : '' }}
                            onClick={() => setActiveHomework(isActive ? null : h.id)}
                          >
                            {isActive ? 'Kapat ▲' : 'Teslimler ▼'}
                          </button>
                        </td>
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

            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <h3>Ödev Performans Raporu (Seçili Sınıf)</h3>
              <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '600' }}>Sınıfın Gönderim Başarısı</span>
                  <span style={{ fontWeight: 'bold', color: performanceRate >= 50 ? '#10b981' : '#ef4444' }}>%{performanceRate}</span>
                </div>
                <div style={{ width: '100%', height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${performanceRate}%`, height: '100%', background: performanceRate >= 50 ? '#10b981' : '#ef4444', transition: 'width 0.5s ease-in-out' }}></div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Atanan {homeworks.length} ödevden {homeworks.filter(h => h.durum === 'gonderildi').length} tanesi (en az bir öğrenci tarafından) teslim edildi.
                </p>
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

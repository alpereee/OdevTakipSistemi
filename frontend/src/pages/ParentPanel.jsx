import { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, MessageSquare, BookOpen, CheckCircle2, Send, Award, CalendarX2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';

const ParentPanel = () => {
  const [activeTab, setActiveTab] = useState('academic'); // academic, attendance
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [attendance, setAttendance] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchHomeworks(selectedStudentId);
      fetchAttendance(selectedStudentId);
    } else {
      setHomeworks([]);
      setAttendance([]);
    }
  }, [selectedStudentId]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('https://odevtakipsistemi.onrender.com/api/users/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Öğrenciler çekilemedi', e);
    }
  };

  const fetchHomeworks = async (studentId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://odevtakipsistemi.onrender.com/api/homeworks/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHomeworks(Array.isArray(response.data) ? response.data : (response.data?.data || []));
    } catch (error) {
      console.error('Ödevler çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`https://odevtakipsistemi.onrender.com/api/attendance/student/${studentId}`, { headers: { Authorization: `Bearer ${token}` } });
      setAttendance(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('https://odevtakipsistemi.onrender.com/api/feedbacks', { mesaj: feedback }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbackSuccess('Geri bildiriminiz öğretmenlere başarıyla iletilmiştir.');
      setFeedback('');
      setTimeout(() => setFeedbackSuccess(''), 5000);
    } catch (err) {
      alert('Hata oluştu.');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div className="glass-panel animate-fade-in" style={{ marginBottom: '2rem' }}>
        <div className="dashboard-header">
          <div>
            <h1>Veli Paneli</h1>
            <p className="subtitle">Öğrencinizin akademik performansını ve devamsızlıklarını takip edin.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <NotificationBell />
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={18} /> Çıkış
            </button>
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Öğrenci Seçin:</h3>
          <select className="input-field" style={{ margin: 0, maxWidth: '300px' }} value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
            <option value="">Lütfen bir öğrenci seçin</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.username} (Sınıf: {s.sinif_id || 'Atanmadı'})</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
          <button onClick={() => setActiveTab('academic')} className={`btn-primary ${activeTab !== 'academic' ? 'outline' : ''}`} style={{ background: activeTab === 'academic' ? '' : 'transparent', color: activeTab === 'academic' ? '' : 'var(--text-dark)' }}>Not Kartı</button>
          <button onClick={() => setActiveTab('attendance')} className={`btn-primary ${activeTab !== 'attendance' ? 'outline' : ''}`} style={{ background: activeTab === 'attendance' ? '' : 'transparent', color: activeTab === 'attendance' ? '' : 'var(--text-dark)' }}>Devamsızlık Takibi</button>
        </div>

        {activeTab === 'academic' && (
          <div className="animate-fade-in card">
            <h3 style={{ marginBottom: '1rem' }}>
              <Award size={20} color="var(--primary-color)" />
              Öğrenci Not Kartı & Performans Durumu
            </h3>

            {!selectedStudentId ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Lütfen yukarıdan bir öğrenci seçin.</p>
            ) : loading ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>Yükleniyor...</p>
            ) : (
              <div className="table-container" style={{ marginBottom: '2rem' }}>
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>Ders & Başlık</th>
                      <th>Öğretmen</th>
                      <th>Durum</th>
                      <th>Alınan Not</th>
                      <th>Öğretmen Yorumu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {homeworks.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Sistemde kayıtlı ödev bulunamadı.</td>
                      </tr>
                    ) : (
                      homeworks.map(hw => {
                        const isSubmitted = hw.teslim_id != null;
                        const hasGrade = hw.not_degeri !== null && hw.not_degeri !== undefined;

                        return (
                          <tr key={hw.id} className={isSubmitted ? 'row-success' : 'row-danger'}>
                            <td>
                              <div style={{ fontWeight: '600' }}>{hw.ders_adi || '-'}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{hw.baslik}</div>
                            </td>
                            <td>{hw.ogretmen_adi || '-'}</td>
                            <td>
                              <span className={`status-badge ${isSubmitted ? 'success' : 'danger'}`}>
                                {isSubmitted ? 'Teslim Edildi' : 'Bekliyor / Yapılmadı'}
                              </span>
                            </td>
                            <td>
                              {hasGrade ? (
                                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: hw.not_degeri >= 50 ? 'var(--success)' : 'var(--danger)' }}>
                                  {hw.not_degeri} / 100
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                              )}
                            </td>
                            <td style={{ fontStyle: 'italic', color: 'var(--text-dark)' }}>
                              {hw.ogretmen_notu ? `"${hw.ogretmen_notu}"` : '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="animate-fade-in card">
            <h3 style={{ marginBottom: '1rem' }}>
              <CalendarX2 size={20} color="var(--danger)" /> Devamsızlık Takibi
            </h3>
            
            {!selectedStudentId ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Lütfen yukarıdan bir öğrenci seçin.</p>
            ) : (
              <table className="glass-table">
                <thead><tr><th>Tarih</th><th>Durum</th></tr></thead>
                <tbody>
                  {attendance.length === 0 ? <tr><td colSpan="2" style={{ textAlign: 'center' }}>Devamsızlık kaydı bulunmuyor.</td></tr> :
                    attendance.map(a => (
                      <tr key={a.id}>
                        <td>{new Date(a.tarih).toLocaleDateString('tr-TR')}</td>
                        <td><span className={`status-badge ${a.durum === 'Raporlu' || a.durum === 'İzinli' ? 'success' : 'danger'}`}>{a.durum}</span></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <div className="glass-panel animate-fade-in" style={{ marginTop: '2rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>
            <MessageSquare size={20} color="var(--warning)" />
            Öğretmene Ulaşın (Geri Bildirim / Şikayet)
          </h3>
        {feedbackSuccess && <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={20} /> {feedbackSuccess}</div>}

        <form onSubmit={handleFeedbackSubmit}>
          <div className="form-group">
            <textarea className="input-field" rows="3" placeholder="Mesajınızı buraya yazın..." value={feedback} onChange={e => setFeedback(e.target.value)} required style={{ resize: 'vertical' }}></textarea>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.75rem 2rem' }}>
              <Send size={18} /> Gönder
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default ParentPanel;

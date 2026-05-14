import { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, MessageSquare, BookOpen, CheckCircle2, Send, Award, CalendarX2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';

const ParentPanel = () => {
  const [activeTab, setActiveTab] = useState('academic'); // academic, attendance
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [attendance, setAttendance] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHomeworks();
    fetchAttendance();
  }, []);

  const fetchHomeworks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://odevtakipsistemi.onrender.com/api/homeworks/student/3', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHomeworks(response.data);
    } catch (error) {
      console.error('Ödevler çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('https://odevtakipsistemi.onrender.com/api/attendance/student/3', { headers: { Authorization: `Bearer ${token}` } });
      setAttendance(res.data);
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

            {loading ? (
              <p>Yükleniyor...</p>
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
                              <div style={{ fontWeight: '600' }}>{hw.ders_adi}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{hw.baslik}</div>
                            </td>
                            <td>{hw.ogretmen_adi}</td>
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

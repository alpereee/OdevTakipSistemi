import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogIn, KeyRound } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('https://odevtakipsistemi.onrender.com/api/auth/login', {
        username,
        password
      });

      console.log("Sunucu Yanıtı:", response.data);

      if (!response.data.token || response.data.role === undefined) {
        setError("Sunucudan beklenen veriler (token/role) gelmedi.");
        return;
      }

      const { token, role } = response.data;
      const userRole = Number(role);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ username, role: userRole }));

      // Role göre yönlendirme (1: Admin, 2: Teacher, 3: Student, 4: Parent)
      if (userRole === 1) navigate('/admin');
      else if (userRole === 2) navigate('/teacher');
      else if (userRole === 3) navigate('/student');
      else if (userRole === 4) navigate('/parent');
      else setError("Geçersiz rol bilgisi.");

    } catch (err) {
      setError(err.response?.data?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetMsg('');
    try {
      const res = await axios.post('https://odevtakipsistemi.onrender.com/api/auth/reset-password', {
        username: resetUsername,
        newPassword
      });
      setResetMsg(res.data.message);
      setTimeout(() => {
        setIsForgotPassword(false);
        setResetMsg('');
      }, 3000);
    } catch (err) {
      setResetMsg(err.response?.data?.message || 'Sıfırlama başarısız.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'var(--primary-color)', margin: '0 auto 1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <LogIn color="white" size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>Ödev Takip Sistemi</h1>
          <p style={{ color: 'var(--text-muted)' }}>Lütfen hesabınıza giriş yapın</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {!isForgotPassword ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Kullanıcı Adı</label>
              <input
                type="text"
                className="input-field"
                placeholder="Örn: ogrenci_ayse"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Şifre</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
              Sisteme Giriş Yap
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setIsForgotPassword(true)}
              >
                Şifremi Unuttum
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="animate-fade-in">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <KeyRound size={20} /> Şifre Sıfırlama
            </h3>
            {resetMsg && <div style={{ marginBottom: '1rem', color: resetMsg.includes('başarıyla') ? 'var(--success)' : 'var(--danger)' }}>{resetMsg}</div>}

            <div className="form-group">
              <label>Kullanıcı Adı</label>
              <input
                type="text"
                className="input-field"
                value={resetUsername}
                onChange={(e) => setResetUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Yeni Şifre</label>
              <input
                type="password"
                className="input-field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
              Şifreyi Güncelle
            </button>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setIsForgotPassword(false)}
              >
                Giriş Ekranına Dön
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;

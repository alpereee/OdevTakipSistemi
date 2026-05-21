import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Header = () => {
  const [schoolName, setSchoolName] = useState('Ödev Takip Sistemi');
  const location = useLocation();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('https://odevtakipsistemi.onrender.com/api/settings');
        if (res.data && res.data.school_name) {
          setSchoolName(res.data.school_name);
        }
      } catch (e) {
        console.error('Ayarlar yüklenemedi:', e);
      }
    };
    fetchSettings();
  }, []);

  // Login sayfasındaysak farklı bir stil ile tam ortada ya da hiç göstermeyebiliriz 
  // ama şu an sol üst köşe için basit bir navbar yapacağız.
  if (location.pathname === '/login') return null; // Login'de kendi büyük başlığı var

  return (
    <header style={{ 
      background: 'rgba(255, 255, 255, 0.8)', 
      backdropFilter: 'blur(10px)', 
      borderBottom: '1px solid var(--glass-border)', 
      padding: '1rem 2rem', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.75rem', 
      position: 'sticky', 
      top: 0, 
      zIndex: 100 
    }}>
      <Building2 size={24} color="var(--primary-color)" />
      <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-dark)' }}>{schoolName}</h2>
    </header>
  );
};

export default Header;

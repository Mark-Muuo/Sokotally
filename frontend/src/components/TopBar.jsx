import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TopBar = () => {
  const { user } = useAuth();
  const [lang, setLang] = useState(() => localStorage.getItem('sokotally_lang') || 'en');
  useEffect(() => {
    localStorage.setItem('sokotally_lang', lang);
    window.dispatchEvent(new Event('langChange'));
  }, [lang]);

  return (
    <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:12, marginBottom:12 }}>
      {/* Only show language selector when user is logged in */}
      {user && (
        <label style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
          <span style={{ color:'#344253', fontSize: 14 }}>Language:</span>
          <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ padding:'0.35rem 0.55rem', borderRadius:8, border:'1px solid #dfe3eb' }}>
            <option value="en">English</option>
            <option value="sw">Swahili</option>
          </select>
        </label>
      )}
      <Link to={user ? '/profile' : '/signin'} aria-label="Profile" title="Profile" style={{ textDecoration:'none' }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background:'#eef0f4', display:'flex', alignItems:'center', justifyContent:'center', color:'#3b82f6', fontWeight:700 }}>
          {(user?.name || 'P').split(' ').map(n => n[0]).join('')}
        </div>
      </Link>
    </div>
  );
};

export default TopBar;



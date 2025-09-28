import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import { useAuth } from '../context/AuthContext';
import { getValidToken } from '../storage/auth';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const Dashboard = () => {
  const [chatMessage, setChatMessage] = useState('');
  const [llmResponse, setLlmResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auth (inline login)
  const { user, signIn, loading: authLoading, error: authError, updateProfile, refreshProfile } = useAuth();
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const handleLoginChange = (e) => setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  const handleInlineLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.phone || !loginForm.password) return alert('Phone and password are required');
    try { await signIn({ phone: loginForm.phone, password: loginForm.password }); } catch {}
  };

  // Language selector
  const [lang, setLang] = useState(() => localStorage.getItem('sokotally_lang') || 'en');
  useEffect(() => {
    const handler = () => setLang(localStorage.getItem('sokotally_lang') || 'en');
    window.addEventListener('langChange', handler);
    return () => window.removeEventListener('langChange', handler);
  }, []);
  const t = useMemo(() => ({
    en: {
      welcome: 'Welcome back',
      todaysSales: "Today's Sales",
      todaysExpenses: "Today's Expenses",
      profitLoss: "Today's Profit/Loss",
      trendUp: '+ from last month',
      aiAssistant: 'AI Assistant',
      aiHelper: 'Ask questions or input bookkeeping details for processing',
      placeholder: 'Enter your bookkeeping details or questions...',
      profileTitle: 'Profile',
      loginToView: 'Login to view your profile',
      phone: 'Phone Number',
      password: 'Password',
      signIn: 'Sign In',
      uploading: 'Uploading...',
      uploadPhoto: 'Upload Photo',
      changePhoto: 'Change Photo',
      language: 'Language',
      english: 'English',
      swahili: 'Swahili',
      profileProgressTitle: 'Complete your profile',
      profileProgressDesc: 'Your profile is {PERCENT}% complete. Tap below to finish.',
      goToProfile: 'Go to Profile'
    },
    sw: {
      welcome: 'Karibu tena',
      todaysSales: 'Mauzo ya Leo',
      todaysExpenses: 'Gharama za Leo',
      profitLoss: 'Faida/Hasara ya Leo',
      trendUp: '+ kutoka mwezi uliopita',
      aiAssistant: 'Msaidizi wa AI',
      aiHelper: 'Uliza maswali au weka maelezo ya uhasibu',
      placeholder: 'Weka maelezo yako ya uhasibu au maswali...',
      profileTitle: 'Wasifu',
      loginToView: 'Ingia ili kuona wasifu wako',
      phone: 'Nambari ya Simu',
      password: 'Nenosiri',
      signIn: 'Ingia',
      uploading: 'Inapakia...',
      uploadPhoto: 'Pakia Picha',
      changePhoto: 'Badilisha Picha',
      language: 'Lugha',
      english: 'Kiingereza',
      swahili: 'Kiswahili',
      profileProgressTitle: 'Kamilisha wasifu wako',
      profileProgressDesc: 'Wasifu wako umekamilika {PERCENT}%. Bofya hapa kukamilisha.',
      goToProfile: 'Nenda kwa Wasifu'
    }
  })[lang], [lang]);

  // Avatar upload
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadOk, setUploadOk] = useState('');
  const onPickAvatar = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setUploadError(''); setUploadOk('');
  };
  const uploadAvatar = async (e) => {
    e.preventDefault();
    setUploadError(''); setUploadOk('');
    if (!avatarFile) return setUploadError('Please select an image');
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('avatar', avatarFile);
      const token = getValidToken();
      const res = await fetch(`${API_BASE}/auth/profile/avatar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd
      });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        if (contentType.includes('application/json')) {
          const j = await res.json();
          throw new Error(j.error || 'Upload failed');
        } else {
          await res.text();
          throw new Error(`Upload failed (${res.status})`);
        }
      }
      if (contentType.includes('application/json')) { await res.json(); }
      setUploadOk('Photo uploaded');
      try { await refreshProfile(); } catch {}
      setAvatarFile(null);
    } catch (err) {
      setUploadError(err.message || 'Could not upload');
    } finally {
      setUploading(false);
    }
  };

  // Profile completion percent (simple fields)
  const basicFields = ['firstName','lastName','town','gender','ageRange','phone'];
  const completed = basicFields.reduce((acc, key) => acc + (user && user[key] ? 1 : 0), 0);
  const percent = Math.round((completed / basicFields.length) * 100);

  // Profile completion popup
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  useEffect(() => {
    if (user && percent < 100) {
      setShowProfilePrompt(true);
    } else {
      setShowProfilePrompt(false);
    }
  }, [user, percent]);

  // Fallback name if not logged in
  const effectiveName = (user && user.name) ? user.name : 'Guest';

  // Mock financial data
  const financialData = {
    sales: 125000,
    expenses: 78000,
    profit: 47000
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    setIsLoading(true);
    
    // Simulate LLM API call
    setTimeout(() => {
      setLlmResponse(`LLM Response: I received your message: "${chatMessage}". This would normally be processed by our AI assistant to help with your bookkeeping needs.`);
      setIsLoading(false);
      setChatMessage('');
    }, 1500);
  };

  const formatCurrency = (amount) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  return (
    <div className="dashboard">
      {/* Top controls moved to Layout header */}

      {/* User Info Header */}
      <header className="user-header">
        <div className="user-info">
          <h1>{t.welcome}, {effectiveName}</h1>
        </div>
        <div className="user-avatar">
          <div className="avatar-circle">
            {(effectiveName || '').split(' ').map(n => n[0]).join('')}
          </div>
        </div>
      </header>

      {/* Profile completion popup */}
      {user && showProfilePrompt && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 2000 }} onClick={() => setShowProfilePrompt(false)}>
          <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ width:'min(560px, 94vw)', background:'#fff', borderRadius:12, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', padding:'1.2rem 1.4rem', border:'1px solid #ffe3a6' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <h3 style={{ margin:0 }}>{t.profileProgressTitle}</h3>
              <button className="btn" type="button" onClick={() => setShowProfilePrompt(false)} aria-label="Close" title="Close" style={{ padding:'0.3rem 0.6rem', width:36, height:36, display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
                ×
              </button>
            </div>
            <p style={{ marginTop:0, color:'#6b7280' }}>{t.profileProgressDesc.replace('{PERCENT}', String(percent))}</p>
            <div style={{ background:'#f3f4f6', height:10, borderRadius:999, overflow:'hidden', margin:'0.5rem 0 1rem' }} aria-label="Profile completion">
              <div style={{ width:`${percent}%`, height:'100%', background:'#f59e0b' }} />
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button className="btn" type="button" onClick={() => setShowProfilePrompt(false)}>Later</button>
              <Link to="/profile" className="btn primary" style={{ textDecoration:'none' }} onClick={() => setShowProfilePrompt(false)}>{t.goToProfile}</Link>
            </div>
          </div>
        </div>
      )}

      {/* Profile moved to standalone page (/profile) */}

      {/* Financial Cards */}
      <div className="financial-cards">
        <div className="card sales-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>{t.todaysSales}</h3>
            <p className="amount">{formatCurrency(financialData.sales)}</p>
            <span className="trend positive">+12.5% {t.trendUp}</span>
          </div>
        </div>

        <div className="card expenses-card">
          <div className="card-icon">💸</div>
          <div className="card-content">
            <h3>{t.todaysExpenses}</h3>
            <p className="amount">{formatCurrency(financialData.expenses)}</p>
            <span className="trend negative">+8.2% {t.trendUp}</span>
          </div>
        </div>

        <div className="card profit-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h3>{t.profitLoss}</h3>
            <p className={`amount profit-amount ${financialData.profit >= 0 ? 'positive' : 'negative'}`}>{formatCurrency(financialData.profit)}</p>
            <span className="trend positive">+15.3% {t.trendUp}</span>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="chat-section">
        <div className="chat-container">
          <h3>{t.aiAssistant}</h3>
          <p>{t.aiHelper}</p>
          
          <form onSubmit={handleChatSubmit} className="chat-form">
            <div className="chat-input-group">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder={t.placeholder}
                className="chat-input"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                className="chat-submit"
                disabled={isLoading || !chatMessage.trim()}
              >
                {isLoading ? '⏳' : (
                  <svg
                    className="arrow-icon"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" clipRule="evenodd" d="M3 12c0-.414.336-.75.75-.75h11.69l-3.72-3.72a.75.75 0 1 1 1.06-1.06l5 5c.293.293.293.767 0 1.06l-5 5a.75.75 0 1 1-1.06-1.06l3.72-3.72H3.75A.75.75 0 0 1 3 12z" />
                  </svg>
                )}
              </button>
            </div>
          </form>

          {/* LLM Response Display */}
          {llmResponse && (
            <div className="llm-response">
              <h4>AI Response:</h4>
              <div className="response-content">
                {llmResponse}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Processing your request...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

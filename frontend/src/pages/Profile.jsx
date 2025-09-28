import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getValidToken } from '../storage/auth';
import './Profile.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const Profile = () => {
    const { user, refreshProfile, updateProfile, signOut, loading, error } = useAuth();
    const [form, setForm] = useState({ name: '', phone: '', firstName: '', lastName: '', town: '', gender: '', ageRange: '' });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadOk, setUploadOk] = useState('');

    // Language support - temporary fallback
    const [lang, setLang] = useState(() => localStorage.getItem('sokotally_lang') || 'en');
    useEffect(() => {
        const handler = () => setLang(localStorage.getItem('sokotally_lang') || 'en');
        window.addEventListener('langChange', handler);
        return () => window.removeEventListener('langChange', handler);
    }, []);
    const t = useMemo(() => ({
        en: {
            title: 'Profile',
            signInPrompt: 'Please sign in to view your profile.',
            profileComplete: 'Your profile is {PERCENT}% complete. Would you like to finish it now?',
            basicInfo: 'Basic Information',
            firstName: 'First Name',
            lastName: 'Last Name',
            town: 'Town',
            phone: 'Phone',
            gender: 'Gender',
            ageRange: 'Age Range',
            select: 'Select',
            male: 'Male',
            female: 'Female',
            other: 'Other',
            under18: '<18',
            age18_25: '18-25',
            age26_35: '26-35',
            age36_50: '36-50',
            age50plus: '50+',
            displayName: 'Display Name (shows in app)',
            saveChanges: 'Save Changes',
            logout: 'Logout',
            uploadPhoto: 'Upload Photo',
            uploading: 'Uploading...',
            photoUploaded: 'Photo uploaded',
            selectImage: 'Please select an image',
            uploadFailed: 'Could not upload'
        },
        sw: {
            title: 'Wasifu',
            signInPrompt: 'Tafadhali ingia ili kuona wasifu wako.',
            profileComplete: 'Wasifu wako umekamilika {PERCENT}%. Je, ungependa kukamilisha sasa?',
            basicInfo: 'Maelezo ya Msingi',
            firstName: 'Jina la Kwanza',
            lastName: 'Jina la Mwisho',
            town: 'Mji',
            phone: 'Simu',
            gender: 'Jinsia',
            ageRange: 'Kipindi cha Umri',
            select: 'Chagua',
            male: 'Mwanaume',
            female: 'Mwanamke',
            other: 'Nyingine',
            under18: '<18',
            age18_25: '18-25',
            age26_35: '26-35',
            age36_50: '36-50',
            age50plus: '50+',
            displayName: 'Jina la Onyesho (linaonyeshwa kwenye programu)',
            saveChanges: 'Hifadhi Mabadiliko',
            logout: 'Ondoka',
            uploadPhoto: 'Pakia Picha',
            uploading: 'Inapakia...',
            photoUploaded: 'Picha imepakiwa',
            selectImage: 'Tafadhali chagua picha',
            uploadFailed: 'Haikuweza kupakia'
        }
    })[lang], [lang]);

    useEffect(() => { if (user) setForm({ name: user.name || '', phone: user.phone || '', firstName: user.firstName || '', lastName: user.lastName || '', town: user.town || '', gender: user.gender || '', ageRange: user.ageRange || '' }); }, [user]);

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const onPickAvatar = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
        setUploadError(''); setUploadOk('');
    };

    const onUpload = async (e) => {
        e.preventDefault();
        setUploadError(''); setUploadOk('');
        if (!avatarFile) return setUploadError(t.selectImage);
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
            setUploadOk(t.photoUploaded);
            setAvatarFile(null);
            try { await refreshProfile(); } catch {}
        } catch (err) {
            setUploadError(err.message || t.uploadFailed);
        } finally {
            setUploading(false);
        }
    };

    const onSave = async (e) => {
        e.preventDefault();
        try {
            await updateProfile({ name: form.name, phone: form.phone, firstName: form.firstName, lastName: form.lastName, town: form.town, gender: form.gender, ageRange: form.ageRange });
        } catch {}
    };

    const totalFields = 6; // firstName, lastName, town, gender, ageRange, phone
    const completed = [form.firstName, form.lastName, form.town, form.gender, form.ageRange, form.phone].filter(Boolean).length;
    const percent = Math.round((completed / totalFields) * 100);

    if (!user) return (
        <div className="profile-page">
            <div className="profile-card">
                <div className="profile-header">
                    <h2>{t.title}</h2>
                    <p>{t.signInPrompt}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="profile-page">
            <div className="profile-card">
                <div className="profile-header">
                    <h2>{t.title}</h2>
                </div>
                
                {percent < 100 && (
                    <div className="profile-completion">
                        {t.profileComplete.replace('{PERCENT}', String(percent))}
                    </div>
                )}
                
                {error && <div className="error-message">{error}</div>}

                <form onSubmit={onUpload}>
                    <div className="avatar-section">
                        <div className="avatar-circle">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="avatar" />
                            ) : (
                                (user.name || '').split(' ').map(n => n[0]).join('')
                            )}
                        </div>
                        <div className="avatar-upload">
                            <input type="file" accept="image/*" onChange={onPickAvatar} />
                            {uploadError && <div className="error-message">{uploadError}</div>}
                            {uploadOk && <div className="success-message">{uploadOk}</div>}
                            <button className="upload-button" disabled={uploading} type="submit">
                                {uploading ? t.uploading : t.uploadPhoto}
                            </button>
                        </div>
                    </div>
                </form>

                <form onSubmit={onSave} className="form-section">
                    <h3>{t.basicInfo}</h3>
                    <div className="form-grid">
                        <div className="form-field">
                            <label>{t.firstName}</label>
                            <input name="firstName" value={form.firstName} onChange={onChange} />
                        </div>
                        <div className="form-field">
                            <label>{t.lastName}</label>
                            <input name="lastName" value={form.lastName} onChange={onChange} />
                        </div>
                        <div className="form-field">
                            <label>{t.town}</label>
                            <input name="town" value={form.town} onChange={onChange} />
                        </div>
                        <div className="form-field">
                            <label>{t.phone}</label>
                            <input name="phone" value={form.phone} onChange={onChange} />
                        </div>
                        <div className="form-field">
                            <label>{t.gender}</label>
                            <select name="gender" value={form.gender} onChange={onChange}>
                                <option value="">{t.select}</option>
                                <option>{t.male}</option>
                                <option>{t.female}</option>
                                <option>{t.other}</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label>{t.ageRange}</label>
                            <select name="ageRange" value={form.ageRange} onChange={onChange}>
                                <option value="">{t.select}</option>
                                <option>{t.under18}</option>
                                <option>{t.age18_25}</option>
                                <option>{t.age26_35}</option>
                                <option>{t.age36_50}</option>
                                <option>{t.age50plus}</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-field full-width">
                        <label>{t.displayName}</label>
                        <input name="name" value={form.name} onChange={onChange} />
                    </div>
                    <div className="form-actions">
                        <button className="btn primary" disabled={loading} type="submit">
                            {t.saveChanges}
                        </button>
                        <button type="button" className="btn secondary" onClick={signOut}>
                            {t.logout}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;



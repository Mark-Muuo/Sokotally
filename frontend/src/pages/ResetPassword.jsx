import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resetPassword } from '../storage/auth';

const ResetPassword = () => {
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [error, setError] = useState('');
	const [ok, setOk] = useState('');

	const onSubmit = (e) => {
		e.preventDefault();
		setError(''); setOk('');
		if (!email || !password || !confirm) return setError('Please fill all fields');
		if (password !== confirm) return setError('Passwords do not match');
		try {
			resetPassword({ email, newPassword: password });
			setOk('Password updated. You can now sign in.');
			setTimeout(() => navigate('/signin'), 1200);
		} catch (e) {
			setError(e.message || 'Could not reset password');
		}
	};

	return (
		<div className="auth-page">
			<form className="auth-card" onSubmit={onSubmit}>
				<h2 style={{ fontSize: '1.6rem' }}>Reset Password</h2>
				{error && <div className="error" role="alert">{error}</div>}
				{ok && (
					<div className="success" style={{background:'#e9f7ef', color:'#1e7e34', padding:'0.7rem 0.9rem', borderRadius:8}} role="status">{ok}</div>
				)}
				<label style={{ fontSize: '1.05rem' }}>Email
					<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
				</label>
				<label style={{ fontSize: '1.05rem' }}>New Password
					<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
				</label>
				<label style={{ fontSize: '1.05rem' }}>Confirm Password
					<input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
				</label>
				<button className="btn primary" type="submit" style={{ fontSize: '1rem' }}>Update Password</button>
				<p><Link to="/signin">Back to Sign In</Link></p>
			</form>
		</div>
	);
};

export default ResetPassword;



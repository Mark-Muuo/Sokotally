import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignIn = () => {
	const { signIn, loading, error } = useAuth();
	const navigate = useNavigate();
	const [form, setForm] = useState({ email: '', password: '' });

	const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	const onSubmit = async (e) => {
		e.preventDefault();
		if (!form.email || !form.password) return alert('Email and password are required');
		try {
			await signIn({ email: form.email, password: form.password });
			navigate('/dashboard');
		} catch {}
	};

	return (
		<div className="auth-page">
			<form className="auth-card" onSubmit={onSubmit}>
				<h2>Sign In</h2>
				{error && <div className="error">{error}</div>}
				<label>Email<input type="email" name="email" value={form.email} onChange={onChange} /></label>
				<label>Password<input type="password" name="password" value={form.password} onChange={onChange} /></label>
				<button className="btn primary" disabled={loading} type="submit">Sign In</button>
				<p><Link to="/reset">Forgot password?</Link></p>
				<p>New here? <Link to="/signup">Create an account</Link></p>
			</form>
		</div>
	);
};

export default SignIn;



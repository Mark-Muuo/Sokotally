import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignUp = () => {
	const { signUp, loading, error } = useAuth();
	const navigate = useNavigate();
	const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });

	const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	const onSubmit = async (e) => {
		e.preventDefault();
		if (!form.name || !form.email || !form.password) return alert('All fields are required');
		if (form.password !== form.confirm) return alert('Passwords do not match');
		try {
			await signUp({ name: form.name, email: form.email, password: form.password });
			navigate('/dashboard');
		} catch {}
	};

	return (
		<div className="auth-page">
			<form className="auth-card" onSubmit={onSubmit}>
				<h2>Create Account</h2>
				{error && <div className="error">{error}</div>}
				<label>Name<input name="name" value={form.name} onChange={onChange} /></label>
				<label>Email<input type="email" name="email" value={form.email} onChange={onChange} /></label>
				<label>Password<input type="password" name="password" value={form.password} onChange={onChange} /></label>
				<label>Confirm Password<input type="password" name="confirm" value={form.confirm} onChange={onChange} /></label>
				<button className="btn primary" disabled={loading} type="submit">Sign Up</button>
				<p>Already have an account? <Link to="/signin">Sign In</Link></p>
			</form>
		</div>
	);
};

export default SignUp;



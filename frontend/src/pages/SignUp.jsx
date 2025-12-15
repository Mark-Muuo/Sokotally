import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignUp = () => {
    const { signUp, loading, error } = useAuth();
	const navigate = useNavigate();
    const [form, setForm] = useState({ 
        firstName: '', 
        lastName: '', 
        phone: '', 
        password: '', 
        confirm: '',
        agreeToTerms: false 
    });
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const validatePhone = (phone) => {
        const phoneRegex = /^(\+254|254|0)?[17]\d{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    };

    const validatePassword = (password) => {
        return password.length >= 8;
    };

	const onChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ 
            ...form, 
            [name]: type === 'checkbox' ? checked : value 
        });
        // Clear validation error when user types
        if (validationErrors[name]) {
            setValidationErrors({ ...validationErrors, [name]: '' });
        }
    };

    const onSubmit = async (e) => {
		e.preventDefault();
        const errors = {};

        if (!form.firstName.trim()) errors.firstName = 'First name is required';
        if (!form.lastName.trim()) errors.lastName = 'Last name is required';
        if (!form.phone.trim()) {
            errors.phone = 'Phone number is required';
        } else if (!validatePhone(form.phone)) {
            errors.phone = 'Please enter a valid phone number';
        }
        if (!form.password) {
            errors.password = 'Password is required';
        } else if (!validatePassword(form.password)) {
            errors.password = 'Password must be at least 8 characters';
        }
        if (!form.confirm) {
            errors.confirm = 'Please confirm your password';
        } else if (form.password !== form.confirm) {
            errors.confirm = 'Passwords do not match';
        }
        if (!form.agreeToTerms) {
            errors.terms = 'You must agree to the terms to continue';
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

		try {
            await signUp({ 
                firstName: form.firstName.trim(), 
                lastName: form.lastName.trim(), 
                phone: form.phone.trim(), 
                password: form.password 
            });
			navigate('/signin');
		} catch (err) {
            console.error('Signup error:', err);
        }
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b1320] via-[#0e1726] to-[#0b1320] p-6 relative overflow-hidden">
			{/* Subtle animated background glow */}
			<div className="absolute inset-0 opacity-20">
				<div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
			</div>

			{/* Back to Home */}
			<div className="fixed top-0 left-0 right-0 p-6 z-50">
				<Link to="/" className="inline-flex items-center gap-2 text-slate-300 font-medium text-base px-4 py-2 hover:text-white transition-all duration-300">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M15 18l-6-6 6-6"/>
					</svg>
					Back to Home
				</Link>
			</div>

			{/* Form Card */}
			<form onSubmit={onSubmit} className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-10 w-full max-w-md shadow-2xl relative z-10 border border-slate-700/50">
				{/* Logo Header */}
				<div className="text-center mb-8">
				<h1 className="text-4xl font-light text-white mb-2 tracking-wide">
					SokoTally
				</h1>
				<p className="text-slate-400 text-sm font-light">Join SokoTally to start tracking your business</p>
			</div>

				<h2 className="text-2xl font-light text-white mb-6 text-center">Create your account</h2>				{error && (
					<div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm font-light border border-red-500/20 flex items-center gap-3">
						<span className="text-lg flex-shrink-0">⚠️</span>
						<span>{error}</span>
					</div>
				)}
            
				{/* Name Row */}
				<div className="grid grid-cols-2 gap-4 mb-5">
					<label className="block">
						<span className="block mb-2 font-light text-slate-300 text-sm">First Name</span>
						<input 
							name="firstName" 
							value={form.firstName} 
							onChange={onChange} 
							placeholder="John" 
							className={`w-full px-4 py-3 border rounded-lg text-base transition-all duration-200 bg-slate-800/50 text-white placeholder-slate-500 font-light focus:outline-none focus:bg-slate-800 ${
								validationErrors.firstName 
									? 'border-red-500/50 focus:border-red-500' 
									: 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
							}`}
						/>
						{validationErrors.firstName && (
							<span className="text-red-400 text-sm font-light mt-2 flex items-center gap-2">
								<span>⚠</span>
								{validationErrors.firstName}
							</span>
						)}
					</label>
					<label className="block">
						<span className="block mb-2 font-light text-slate-300 text-sm">Last Name</span>
						<input 
							name="lastName" 
							value={form.lastName} 
							onChange={onChange} 
							placeholder="Doe"
							className={`w-full px-4 py-3 border rounded-lg text-base transition-all duration-200 bg-slate-800/50 text-white placeholder-slate-500 font-light focus:outline-none focus:bg-slate-800 ${
								validationErrors.lastName 
									? 'border-red-500/50 focus:border-red-500' 
									: 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
							}`}
						/>
						{validationErrors.lastName && (
							<span className="text-red-400 text-sm font-light mt-2 flex items-center gap-2">
								<span>⚠</span>
								{validationErrors.lastName}
							</span>
						)}
					</label>
				</div>

				{/* Phone */}
				<label className="block mb-5">
					<span className="block mb-2 font-light text-slate-300 text-sm">Phone Number</span>
					<input 
						type="tel" 
						name="phone" 
						value={form.phone} 
						onChange={onChange} 
						placeholder="0712345678 or +254712345678"
						className={`w-full px-4 py-3 border rounded-lg text-base transition-all duration-200 bg-slate-800/50 text-white placeholder-slate-500 font-light focus:outline-none focus:bg-slate-800 ${
							validationErrors.phone 
								? 'border-red-500/50 focus:border-red-500' 
								: 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
						}`}
					/>
					{validationErrors.phone && (
						<span className="text-red-400 text-sm font-light mt-2 flex items-center gap-2">
							<span>⚠</span>
							{validationErrors.phone}
						</span>
					)}
				</label>

				{/* Password */}
				<label className="block mb-5">
					<span className="block mb-2 font-light text-slate-300 text-sm">Password</span>
					<div className="relative flex items-center gap-2">
						<input 
							type={showPassword ? 'text' : 'password'} 
							name="password" 
							value={form.password} 
							onChange={onChange} 
							placeholder="Create a strong password"
							className={`w-full px-4 py-3 border rounded-lg text-base transition-all duration-200 bg-slate-800/50 text-white placeholder-slate-500 font-light focus:outline-none focus:bg-slate-800 ${
								validationErrors.password 
									? 'border-red-500/50 focus:border-red-500' 
									: 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
							}`}
						/>
						<button 
							type="button" 
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 text-slate-400 text-sm font-light hover:text-slate-200 transition-all duration-200"
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							👁
						</button>
					</div>
					{validationErrors.password && (
						<span className="text-red-400 text-sm font-light mt-2 flex items-center gap-2">
							<span>⚠</span>
							{validationErrors.password}
						</span>
					)}
					{!validationErrors.password && (
						<span className="text-slate-500 text-sm mt-2 block font-light">At least 8 characters</span>
					)}
				</label>

				{/* Confirm Password */}
				<label className="block mb-6">
					<span className="block mb-2 font-light text-slate-300 text-sm">Confirm Password</span>
					<div className="relative flex items-center gap-2">
						<input 
							type={showConfirm ? 'text' : 'password'} 
							name="confirm" 
							value={form.confirm} 
							onChange={onChange} 
							placeholder="Re-enter your password"
							className={`w-full px-4 py-3 border rounded-lg text-base transition-all duration-200 bg-slate-800/50 text-white placeholder-slate-500 font-light focus:outline-none focus:bg-slate-800 ${
								validationErrors.confirm 
									? 'border-red-500/50 focus:border-red-500' 
									: 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
							}`}
						/>
						<button 
							type="button" 
							onClick={() => setShowConfirm(!showConfirm)}
							className="absolute right-3 text-slate-400 text-sm font-light hover:text-slate-200 transition-all duration-200"
							aria-label={showConfirm ? 'Hide password' : 'Show password'}
						>
							👁
						</button>
					</div>
					{validationErrors.confirm && (
						<span className="text-red-400 text-sm font-light mt-2 flex items-center gap-2">
							<span>⚠</span>
							{validationErrors.confirm}
						</span>
					)}
				</label>

				{/* Terms Checkbox */}
				<div className="flex items-start gap-4 my-6 px-4 py-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-all">
					<input 
						type="checkbox" 
						name="agreeToTerms" 
						checked={form.agreeToTerms}
						onChange={onChange}
						id="terms-checkbox"
						className="w-4 h-4 mt-0.5 cursor-pointer flex-shrink-0 accent-blue-500"
					/>
					<label htmlFor="terms-checkbox" className="text-sm font-light text-slate-300 cursor-pointer leading-relaxed">
						I agree to the Terms of Service and Privacy Policy
					</label>
				</div>
				{validationErrors.terms && (
					<span className="text-red-400 text-sm font-light -mt-4 mb-4 flex items-center gap-2">
						<span>⚠</span>
						{validationErrors.terms}
					</span>
				)}

				{/* Submit Button */}
				<button 
					className="w-full px-6 py-3 bg-white text-slate-900 text-base font-medium rounded-lg shadow-lg hover:shadow-xl hover:bg-slate-50 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
					disabled={loading} 
					type="submit"
				>
					{loading ? 'Creating Account...' : 'Create Account'}
				</button>
				
				{/* Footer */}
				<div className="text-center mt-6 pt-6 border-t border-slate-700/50 text-slate-400 text-sm">
					<p className="font-light">
						Already have an account?{' '}
						<Link to="/signin" className="text-blue-400 font-medium hover:text-blue-300 hover:underline transition-all">
							Sign in
						</Link>
					</p>
				</div>
			</form>
		</div>
	);
};

export default SignUp;



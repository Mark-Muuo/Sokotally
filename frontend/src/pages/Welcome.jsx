import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Welcome = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScrollTo = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#0b1320] via-[#0e1726] to-[#0b1320]">
			{/* Navigation */}
			<nav className="fixed top-0 left-0 right-0 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/10 z-50">
				<div className="max-w-7xl mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-2xl font-light">
							<span className="text-3xl">🏪</span>
							<span className="text-white tracking-wide">
								SokoTally
							</span>
						</div>

						{/* Desktop Nav Links */}
						<div className="hidden md:flex items-center gap-8">
							<a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="text-slate-300 hover:text-white font-light transition-colors">
								Features
							</a>
							<a href="#how" onClick={(e) => handleScrollTo(e, 'how')} className="text-slate-300 hover:text-white font-light transition-colors">
								How It Works
							</a>
						</div>

						{/* Desktop Actions */}
						<div className="hidden md:flex items-center gap-3">
							<Link
								to="/signin"
								className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-white font-medium hover:bg-white/5 hover:border-blue-400/40 transition-all duration-200"
							>
								Sign In
							</Link>
							<Link
								to="/signup"
								className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
							>
								Join Beta
							</Link>
						</div>

						{/* Mobile Menu Button */}
						<button 
							className="md:hidden text-2xl p-2 hover:bg-slate-800 rounded-lg transition-colors text-white" 
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							aria-label="Toggle menu"
						>
							{mobileMenuOpen ? '✕' : '☰'}
						</button>
					</div>

					{/* Mobile Menu */}
					{mobileMenuOpen && (
						<div className="md:hidden mt-4 pb-4 flex flex-col gap-3">
							<a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="text-slate-300 hover:text-white font-light py-2 transition-colors">
								Features
							</a>
							<a href="#how" onClick={(e) => handleScrollTo(e, 'how')} className="text-slate-300 hover:text-white font-light py-2 transition-colors">
								How It Works
							</a>
							<div className="flex flex-col gap-2 mt-2">
								<Link
									to="/signin"
									className="text-center inline-flex items-center justify-center px-4 py-2 rounded-full border border-white/10 text-white font-medium hover:bg.white/5 hover:border-blue-400/40 transition-all"
								>
									Sign In
								</Link>
								<Link
									to="/signup"
									className="text-center inline-flex items-center justify-center px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
								>
									Join Beta
								</Link>
							</div>
						</div>
					)}
				</div>
			</nav>

			{/* Hero Section */}
			<div className="pt-32 pb-20 px-6 relative overflow-hidden">
				{/* Decorative elements */}
				<div className="absolute inset-0 opacity-20">
					<div className="absolute top-20 right-1/4 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl animate-pulse"></div>
					<div className="absolute bottom-20 left-1/4 w-96 h-96 bg-indigo-400/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
				</div>

				<div className="max-w-7xl mx-auto relative z-10">
					<header className="text-center max-w-4xl mx-auto mb-16">
						<div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-300 border border-blue-500/20 px-4 py-2 rounded-full text-sm font-light mb-6">
							<span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
							Research-backed solution for informal vendors across Kenya
						</div>

						<h1 className="text-5xl md:text-6xl font-light text-white mb-6 leading-tight tracking-tight">
							Empowering Vegetable Vendors with{' '}
								<span className="text-blue-500 font-normal">
								Smart Record-Keeping
							</span>
						</h1>

						<p className="text-lg text-slate-300 mb-8 leading-relaxed font-light">
							Over 70% of informal traders in Kenya lack proper financial records. SokoTally bridges this gap with a simple, AI-powered system that speaks your language—record transactions in Kiswahili or English, track debts, manage stock, and access financial services.
						</p>

						<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
							<Link to="/signup" className="bg-white text-slate-900 font-medium px-8 py-4 rounded-lg shadow-lg hover:shadow-xl hover:bg-slate-50 transition-all">
								Join Beta Program
							</Link>
							<a href="#how" onClick={(e) => handleScrollTo(e, 'how')} className="bg-slate-800/50 text-white font-medium px-8 py-4 rounded-lg border border-slate-700 hover:border-blue-500 hover:bg-slate-800 transition-all">
								Learn More
							</a>
						</div>

						<p className="text-sm text-slate-400 font-light">
							Free for early adopters • Available in English & Kiswahili
						</p>
					</header>

					{/* Dashboard Preview */}
					<section className="max-w-5xl mx-auto">
						<div className="bg-[#2d3a4d]/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
							{/* Preview Header */}
							<div className="bg-[#344154] px-6 py-4 flex items-center justify-between border-b border-slate-700/50">
								<div className="flex items-center gap-2">
									<span className="w-3 h-3 bg-red-400/70 rounded-full"></span>
									<span className="w-3 h-3 bg-yellow-400/70 rounded-full"></span>
									<span className="w-3 h-3 bg-green-400/70 rounded-full"></span>
								</div>
								<div className="text-white font-light text-sm">Today's Sales</div>
							</div>

							{/* Preview Content */}
							<div className="p-8">
								<div className="grid md:grid-cols-2 gap-6 mb-8">
									<div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-6 rounded-xl border border-emerald-400/30 shadow-lg shadow-emerald-500/10">
										<div className="text-emerald-300 text-sm font-light mb-2">Sales Today</div>
										<div className="text-3xl font-light text-white mb-1">KSh 12,450</div>
										<div className="text-emerald-300 text-sm font-light">+18% from yesterday</div>
									</div>
									<div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/10 p-6 rounded-xl border border-blue-400/30 shadow-lg shadow-blue-500/10">
										<div className="text-blue-300 text-sm font-light mb-2">Debts Owed</div>
										<div className="text-3xl font-light text-white mb-1">KSh 3,200</div>
										<div className="text-blue-300 text-sm font-light">5 customers</div>
									</div>
								</div>

								{/* Chart Preview */}
								<div className="flex items-end justify-around gap-2 h-32 bg-[#1e2a3a]/50 rounded-xl p-6 border border-white/5">
									<div className="w-full bg-gradient-to-t from-blue-500 via-blue-400 to-blue-300 rounded-t-lg shadow-lg shadow-blue-500/50" style={{height: '60%'}}></div>
									<div className="w-full bg-gradient-to-t from-blue-500 via-blue-400 to-blue-300 rounded-t-lg shadow-lg shadow-blue-500/50" style={{height: '75%'}}></div>
									<div className="w-full bg-gradient-to-t from-blue-500 via-blue-400 to-blue-300 rounded-t-lg shadow-lg shadow-blue-500/50" style={{height: '45%'}}></div>
									<div className="w-full bg-gradient-to-t from-blue-500 via-blue-400 to-blue-300 rounded-t-lg shadow-lg shadow-blue-500/50" style={{height: '90%'}}></div>
									<div className="w-full bg-gradient-to-t from-blue-500 via-blue-400 to-blue-300 rounded-t-lg shadow-lg shadow-blue-500/50" style={{height: '70%'}}></div>
									<div className="w-full bg-gradient-to-t from-blue-500 via-blue-400 to-blue-300 rounded-t-lg shadow-lg shadow-blue-500/50" style={{height: '85%'}}></div>
									<div className="w-full bg-gradient-to-t from-blue-500 via-blue-400 to-blue-300 rounded-t-lg shadow-lg shadow-blue-500/50" style={{height: '55%'}}></div>
								</div>
							</div>
						</div>
					</section>

					{/* Social Proof */}
					<section className="mt-16 text-center">
						<p className="text-slate-400 font-light mb-6">Addressing a critical need in Kenya's informal economy</p>
						<div className="flex flex-wrap items-center justify-center gap-8 text-slate-300 font-light">
							<div className="flex items-center gap-2">
								<span className="text-2xl">📱</span>
								65% Smartphone Penetration
							</div>
							<div className="flex items-center gap-2">
								<span className="text-2xl">💬</span>
								Kiswahili & English
							</div>
							<div className="flex items-center gap-2">
								<span className="text-2xl">💰</span>
								70% Lack Financial Records
							</div>
						</div>
					</section>
				</div>
			</div>

			{/* Features Section */}
			<section id="features" className="py-20 px-6 border-y border-white/5">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-light text-white mb-4 tracking-tight">
							Built for Kenya's Informal Traders
						</h2>
						<p className="text-lg text-slate-300 max-w-2xl mx-auto font-light">
							Simple tools designed specifically for vegetable vendors and informal traders
						</p>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
						{/* Feature 1 */}
						<div className="group bg-[#0f172a]/70 backdrop-blur-sm p-8 rounded-2xl border border-white/5 hover:border-blue-400/40 hover:shadow-2xl hover:shadow-blue-500/15 hover:bg-[#0f172a]/90 transition-all duration-300">
							<h3 className="text-xl font-medium text-white mb-3"><span className="mr-2">📝</span>Voice & Text Recording</h3>
							<p className="text-slate-300 leading-relaxed font-light">
								Record sales using voice messages in Kiswahili or English. AI extracts details automatically—no typing required.
							</p>
						</div>

						{/* Feature 2 */}
						<div className="group bg-[#0f172a]/70 backdrop-blur-sm p-8 rounded-2xl border border-white/5 hover:border-blue-400/40 hover:shadow-2xl hover:shadow-blue-500/15 hover:bg-[#0f172a]/90 transition-all duration-300">
							<h3 className="text-xl font-medium text-white mb-3"><span className="mr-2">🧠</span>AI Assistant</h3>
							<p className="text-slate-300 leading-relaxed font-light">
								Ask questions about your business in simple language. Get instant insights on profits, debts, and inventory.
							</p>
						</div>

						{/* Feature 3 */}
						<div className="group bg-[#0f172a]/70 backdrop-blur-sm p-8 rounded-2xl border border-white/5 hover:border-blue-400/40 hover:shadow-2xl hover:shadow-blue-500/15 hover:bg-[#0f172a]/90 transition-all duration-300">
							<h3 className="text-xl font-medium text-white mb-3"><span className="mr-2">📈</span>Financial Insights</h3>
							<p className="text-slate-300 leading-relaxed font-light">
								Track daily sales, expenses, and profits. See patterns in your business with easy-to-understand charts.
							</p>
						</div>

						{/* Feature 4 */}
						<div className="group bg-[#0f172a]/70 backdrop-blur-sm p-8 rounded-2xl border border-white/5 hover:border-blue-400/40 hover:shadow-2xl hover:shadow-blue-500/15 hover:bg-[#0f172a]/90 transition-all duration-300">
							<h3 className="text-xl font-medium text-white mb-3"><span className="mr-2">🌐</span>Multilingual Support</h3>
							<p className="text-slate-300 leading-relaxed font-light">
								Use the app in English or Kiswahili. Switch languages anytime to match your preference.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section id="how" className="py-20 px-6">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-light text-white mb-4 tracking-tight">
							How It Works
						</h2>
						<p className="text-lg text-slate-300 font-light">
							Three simple steps to better business management
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-12">
						{/* Step 1 */}
					<div className="text-center">
						<div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white text-2xl font-medium mx-auto mb-6 shadow-lg shadow-blue-500/20">
							1
						</div>
						<h3 className="text-2xl font-medium text-white mb-4">Sign Up</h3>
							<p className="text-slate-300 leading-relaxed font-light">
								Create your free account using just your phone number. Choose your preferred language: English or Kiswahili.
							</p>
						</div>

						{/* Step 2 */}
					<div className="text-center">
						<div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white text-2xl font-medium mx-auto mb-6 shadow-lg shadow-blue-500/20">
							2
						</div>
						<h3 className="text-2xl font-medium text-white mb-4">Record Sales</h3>
							<p className="text-slate-300 leading-relaxed font-light">
								Send voice messages or type transactions. Our AI understands and organizes everything automatically.
							</p>
						</div>

						{/* Step 3 */}
					<div className="text-center">
						<div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white text-2xl font-medium mx-auto mb-6 shadow-lg shadow-blue-500/20">
							3
						</div>
						<h3 className="text-2xl font-medium text-white mb-4">Track & Grow</h3>
							<p className="text-slate-300 leading-relaxed font-light">
								View insights, manage debts, and make informed decisions. Access financial services when you're ready.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-24 px-6 relative overflow-hidden">
				<div className="absolute inset-0 opacity-20">
					<div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/25 rounded-full blur-3xl"></div>
					<div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/25 rounded-full blur-3xl"></div>
				</div>

				<div className="max-w-4xl mx-auto text-center relative z-10">
					<h2 className="text-4xl md:text-5xl font-light text-white mb-6 tracking-tight">
						Ready to Transform Your Business?
					</h2>
					<p className="text-lg text-slate-300 mb-10 font-light">
						Join the beta program today and be part of the solution for Kenya's informal economy
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
						<Link
							to="/signup"
							className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
						>
							<span className="inline-block">Join Beta</span>
						</Link>

						<Link
							to="/signin"
							className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-white/10 text-white font-medium hover:bg-white/5 hover:border-blue-400/40 transition-all duration-200"
						>
							<span className="inline-block">Sign In</span>
						</Link>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-[#0f172a] text-slate-400 py-12 px-6 border-t border-white/5">
				<div className="max-w-7xl mx-auto">
					<div className="flex flex-col md:flex-row items-center justify-between gap-8">
						{/* Brand */}
						<div className="flex items-center gap-2">
							<span className="text-2xl">🏪</span>
							<span className="text-white font-light text-lg">SokoTally</span>
						</div>

						{/* Links */}
						<div className="flex items-center gap-8 text-sm font-light">
							<a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="hover:text-white transition-colors">Features</a>
							<a href="#how" onClick={(e) => handleScrollTo(e, 'how')} className="hover:text-white transition-colors">How It Works</a>
							<Link to="/signin" className="hover:text-white transition-colors">Sign In</Link>
							<Link to="/signup" className="hover:text-white transition-colors">Join Beta</Link>
						</div>

						{/* Copyright */}
						<div className="text-sm font-light">
							© {new Date().getFullYear()} SokoTally
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
};

export default Welcome;

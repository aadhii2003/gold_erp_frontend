import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../app/store';
import apiClient from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { User, Lock, ArrowRight, ShieldCheck, Landmark, Moon, Sun, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getConstantsOffline, getUsersOffline } from '../../db/indexedDB';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await apiClient.post('/auth/login/', { username, password });
            const decoded: any = jwtDecode(res.data.access);
            
            const user = {
                username: decoded.username,
                role: decoded.role,
                branch_id: decoded.branch_id
            };
            
            dispatch(setCredentials({ token: res.data.access, user }));
            
            if (user.role === 'STAFF') {
                navigate('/pos');
            } else if (user.role === 'MANAGER') {
                navigate('/manager');
            } else {
                navigate('/admin');
            }
        } catch (err) {
            setError('Authentication failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-main)] relative overflow-hidden transition-colors duration-500">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--gold-primary)] opacity-[0.03] dark:opacity-[0.07] blur-[120px] rounded-full transition-opacity duration-500"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--gold-secondary)] opacity-[0.03] dark:opacity-[0.07] blur-[120px] rounded-full transition-opacity duration-500"></div>

            {/* Theme Toggle */}
            <button 
                onClick={toggleTheme}
                className="absolute top-8 right-8 p-3 rounded-full bg-[var(--bg-card)] border border-[var(--border-main)] shadow-lg hover:scale-110 transition-all z-20"
            >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>

            <div className="w-full max-w-[1000px] grid md:grid-cols-2 bg-[var(--bg-card)] rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-main)] relative z-10">
                
                {/* Left Side: Brand/Visual */}
                <div className="hidden md:flex flex-col justify-between p-12 bg-zinc-950 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black"></div>
                    <div className="absolute inset-0 opacity-10 animate-shine pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-12 h-12 rounded-xl bg-[var(--gold-gradient)] flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <Landmark className="text-black w-7 h-7" />
                            </div>
                            <span className="text-2xl font-black tracking-widest text-white">AURUM</span>
                        </div>
                        
                        <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
                            Precision in <br /><span className="gold-text">Gold Management.</span>
                        </h1>
                        <p className="text-zinc-400 text-lg max-w-sm leading-relaxed">
                            The enterprise-grade solution for modern jewelry businesses, refineries, and gold traders.
                        </p>
                    </div>

                    <div className="relative z-10 mt-auto">
                        <div className="flex items-center gap-6 text-zinc-500 text-sm">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-[var(--gold-primary)]" />
                                <span className="font-medium">Secure Terminal</span>
                            </div>
                            <div className="w-1 h-1 bg-zinc-800 rounded-full"></div>
                            <span className="font-mono">v2.4.0</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="p-8 md:p-16 flex flex-col justify-center">
                    <div className="mb-10">
                        <h2 className="text-3xl font-bold text-[var(--text-main)] mb-3">Welcome Back</h2>
                        <p className="text-[var(--text-muted)] text-lg">Access your dashboard and manage terminal operations.</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-8 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[var(--text-main)] ml-1">Username</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--gold-primary)] transition-colors">
                                    <User className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-main)] rounded-xl py-4 pl-12 pr-4 text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)] focus:ring-4 focus:ring-[var(--gold-primary)]/10 transition-all placeholder:text-zinc-500"
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-sm font-semibold text-[var(--text-main)]">Password</label>
                                <button type="button" className="text-xs font-medium text-[var(--gold-primary)] hover:text-[var(--gold-secondary)] transition-colors">Forgot password?</button>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--gold-primary)] transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-main)] rounded-xl py-4 pl-12 pr-12 text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)] focus:ring-4 focus:ring-[var(--gold-primary)]/10 transition-all placeholder:text-zinc-500"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--gold-primary)] transition-colors"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-white text-black font-black py-5 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 group overflow-hidden relative border-2 border-black mt-6 shadow-none hover:shadow-[0_10px_20px_-10px_#f6d365] active:scale-[0.95]"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="text-lg">Access Terminal</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-12 text-center text-xs text-[var(--text-muted)] font-medium uppercase tracking-widest">
                        Security Layer: <span className="text-[var(--gold-primary)]">Encrypted Endpoint</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;

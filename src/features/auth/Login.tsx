import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../app/store';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://127.0.0.1:8000/api/auth/login/', { username, password });
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
            setError('Invalid credentials or system error.');
        }
    };

    return (
        <div className="flex items-center justify-center h-[80vh]">
            <div className="card w-full max-w-md">
                <h2 className="text-3xl font-bold mb-6 text-center tracking-tight">GOLD SYSTEM</h2>
                {error && <div className="bg-red-900/50 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-[var(--text-muted)] mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="input-field"
                            placeholder="Enter username"
                        />
                    </div>
                    <div>
                        <label className="block text-[var(--text-muted)] mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            placeholder="Enter password"
                        />
                    </div>
                    <button type="submit" className="btn-primary w-full mt-6">
                        Access Terminal
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;

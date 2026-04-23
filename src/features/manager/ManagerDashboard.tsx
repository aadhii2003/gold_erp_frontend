import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Users, 
    ReceiptText, 
    LogOut,
    Plus,
    Monitor,
    Search,
    ChevronRight,
    TrendingUp
} from 'lucide-react';

const ManagerDashboard = () => {
    const { token, user } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('dashboard');
    
    const [newUsername, setNewUsername] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [sales, setSales] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);

    useEffect(() => {
        if (!user || user.role === 'STAFF') {
            navigate('/pos');
        } else {
            fetchSales();
            fetchStaff();
        }
    }, [user, navigate]);

    const fetchSales = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/sales/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSales(res.data);
        } catch(e) { console.error(e); }
    };

    const fetchStaff = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/users/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStaffList(res.data);
        } catch(e) { console.error(e); }
    };

    const createStaff = async () => {
        if (!newUsername || !newPassword) return;
        try {
            await axios.post('http://127.0.0.1:8000/api/users/create/', { 
                username: newUsername, 
                email: newEmail,
                password: newPassword, 
                role: 'STAFF' 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Staff Authorization Issued.');
            setNewUsername('');
            setNewEmail('');
            setNewPassword('');
            fetchStaff();
        } catch(e) { alert('Authorization failed.'); }
    };

    const SidebarItem = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-6 py-3.5 transition-colors ${
                activeTab === id 
                ? 'bg-zinc-800 text-white' 
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
        >
            <Icon size={18} />
            <span className="text-sm font-medium">{label}</span>
        </button>
    );

    return (
        <div className="flex h-[88vh] bg-zinc-950 font-sans overflow-hidden rounded-xl border border-zinc-900 shadow-2xl">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-900 flex flex-col bg-zinc-950">
                <div className="p-6 border-b border-zinc-900 mb-4">
                    <h1 className="text-xl font-bold text-white tracking-tight">Manager Node</h1>
                    <p className="text-xs text-zinc-600 mt-1 uppercase font-medium">{user?.branch_name || 'Assigned Branch'}</p>
                </div>

                <nav className="flex-1">
                    <SidebarItem id="dashboard" label="Overview" icon={LayoutDashboard} />
                    <SidebarItem id="ledger" label="Transaction Ledger" icon={ReceiptText} />
                    <SidebarItem id="terminals" label="Terminal Management" icon={Monitor} />
                </nav>

                <div className="p-6 border-t border-zinc-900">
                    <button 
                        onClick={() => navigate('/login')}
                        className="w-full flex items-center gap-3 text-zinc-400 hover:text-red-400 transition-colors py-2 text-sm font-medium"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                {/* Header */}
                <div className="mb-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-semibold text-white capitalize">
                            {activeTab}
                        </h2>
                        <p className="text-sm text-zinc-500 mt-1">Operational Control Center</p>
                    </div>
                </div>

                {/* Dashboard / Overview */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="card p-6">
                                <TrendingUp className="text-emerald-400 mb-4" size={24} />
                                <p className="text-2xl font-semibold text-white">${sales.reduce((acc, s) => acc + Number(s.subtotal), 0).toLocaleString()}</p>
                                <p className="text-sm text-zinc-500 mt-1">Branch Revenue</p>
                            </div>
                            <div className="card p-6">
                                <ReceiptText className="text-blue-400 mb-4" size={24} />
                                <p className="text-2xl font-semibold text-white">{sales.length}</p>
                                <p className="text-sm text-zinc-500 mt-1">Daily Transactions</p>
                            </div>
                            <div className="card p-6">
                                <Users className="text-purple-400 mb-4" size={24} />
                                <p className="text-2xl font-semibold text-white">{staffList.filter(s => s.role === 'STAFF').length}</p>
                                <p className="text-sm text-zinc-500 mt-1">Active Staff</p>
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="text-lg font-medium text-white mb-6">Recent Activity</h3>
                            <div className="space-y-4">
                                {sales.slice(0, 5).map(s => (
                                    <div key={s.id} className="flex justify-between items-center bg-zinc-900/50 p-4 rounded border border-zinc-800">
                                        <div>
                                            <p className="text-sm font-medium text-white">{s.product_name}</p>
                                            <p className="text-xs text-zinc-500">{new Date(s.created_at).toLocaleTimeString()}</p>
                                        </div>
                                        <p className="text-sm font-bold text-emerald-400">+${Number(s.subtotal).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Ledger Tab */}
                {activeTab === 'ledger' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="card p-0 overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-zinc-800 text-zinc-500 text-xs font-medium bg-zinc-900/50">
                                        <th className="p-4">Time</th>
                                        <th className="p-4">Terminal</th>
                                        <th className="p-4">Material Details</th>
                                        <th className="p-4">Specs</th>
                                        <th className="p-4 text-right">Settlement</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {sales.map(sale => (
                                        <tr key={sale.id} className="border-b border-zinc-900 hover:bg-zinc-900/40 transition-colors">
                                            <td className="p-4 text-zinc-400">{new Date(sale.created_at).toLocaleTimeString()}</td>
                                            <td className="p-4 text-white font-medium">{sale.staff_name}</td>
                                            <td className="p-4">
                                                <p className="text-white">{sale.product_name}</p>
                                                <p className="text-xs text-zinc-600">{sale.quantity_grams}g</p>
                                            </td>
                                            <td className="p-4 text-zinc-400">{sale.actual_product_quality}% Purity</td>
                                            <td className="p-4 text-right">
                                                <p className="text-white font-semibold">${Number(sale.subtotal).toLocaleString()}</p>
                                                <p className="text-xs text-zinc-600">{Number(sale.total_ugx).toLocaleString()} UGX</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Terminals Tab */}
                {activeTab === 'terminals' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
                        <div className="lg:col-span-2 space-y-4">
                            {staffList.filter(s => s.role === 'STAFF').map(s => (
                                <div key={s.id} className="card flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <Monitor className="text-zinc-600" size={24} />
                                        <div>
                                            <p className="text-white font-semibold">{s.username}</p>
                                            <p className="text-xs text-zinc-500">Active Node</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-zinc-700" size={18} />
                                </div>
                            ))}
                        </div>

                        <div className="card h-fit">
                            <h3 className="text-white font-medium mb-6 flex items-center gap-2"><Plus size={18} /> Authorize Terminal</h3>
                            <div className="space-y-4">
                                <input type="text" placeholder="Username" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="input-field" />
                                <input type="email" placeholder="Email (Optional)" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="input-field" />
                                <input type="password" placeholder="Access Passkey" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field" />
                                <button onClick={createStaff} className="btn-primary w-full mt-2">Provision Node</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ManagerDashboard;


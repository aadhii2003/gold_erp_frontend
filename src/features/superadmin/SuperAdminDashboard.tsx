import { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    ShieldAlert,
    HistoryIcon,
    LogOut,
    Eye,
    EyeOff,
    Trash2,
    Plus,
    RefreshCw,
    Search,
    UserPlus,
    Lock,
    Unlock,
    Activity,
    Server,
    Shield
} from 'lucide-react';

const SuperAdminDashboard = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Admin Creation State
    const [newAdminUsername, setNewAdminUsername] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!user || user.role !== 'SUPER_ADMIN') {
            navigate('/');
            return;
        }
        fetchUsers();
        fetchLogs();
    }, [user, navigate]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/users/');
            setUsers(res.data);
        } catch (e) { console.error('Failed to fetch users'); }
        setLoading(false);
    };

    const fetchLogs = async () => {
        try {
            const res = await apiClient.get('/user-logs/');
            setLogs(res.data);
        } catch (e) { console.error('Failed to fetch logs'); }
    };

    const createAdmin = async () => {
        if (!newAdminUsername || !newAdminPassword) return;
        if (!window.confirm(`Authorize ${newAdminUsername} as a Global Administrator?`)) return;
        
        try {
            await apiClient.post('/users/create/', {
                username: newAdminUsername,
                password: newAdminPassword,
                email: newAdminEmail,
                role: 'ADMIN'
            });
            setNewAdminUsername('');
            setNewAdminPassword('');
            setNewAdminEmail('');
            fetchUsers();
            alert('Global Administrator successfully provisioned.');
        } catch (e: any) {
            alert('Failed to create admin: ' + JSON.stringify(e.response?.data || 'Unknown error'));
        }
    };

    const toggleUserStatus = async (userId: number) => {
        try {
            await apiClient.patch(`/users/${userId}/toggle/`);
            fetchUsers();
        } catch (e) { alert('Status toggle failed'); }
    };

    const deleteUser = async (userId: number) => {
        if (!window.confirm('PERMANENTLY DESTRUCTIVE: Delete this account and all associated metadata?')) return;
        try {
            await apiClient.delete(`/users/${userId}/delete/`);
            fetchUsers();
        } catch (e) { alert('Deletion failed'); }
    };

    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const NavItem = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-6 py-4 transition-all relative group ${activeTab === id
                ? 'bg-black text-white shadow-xl rounded-2xl scale-[1.02]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-black hover:bg-[hsl(var(--muted)/0.5)] rounded-2xl'
                }`}
        >
            <Icon size={18} />
            <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );

    return (
        <div className="flex h-screen bg-[#fcfcfc] font-sans overflow-hidden">
            {/* Super Sidebar */}
            <aside className="w-80 border-r border-zinc-200 flex flex-col bg-white z-10 shadow-2xl">
                <div className="p-8 border-b border-zinc-100 bg-zinc-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg">
                            <Shield className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="font-black text-xs tracking-widest uppercase text-black">Grand Central</h1>
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-800 mt-1">Super Admin Authority</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-6 py-10 space-y-3">
                    <NavItem id="overview" label="System Pulse" icon={LayoutDashboard} />
                    <NavItem id="admins" label="Admin Management" icon={ShieldCheck} />
                    <NavItem id="users" label="Universal User List" icon={Users} />
                    <NavItem id="logs" label="Global Audit Trail" icon={HistoryIcon} />
                    <NavItem id="syncs" label="Sync Intelligence" icon={Server} />
                </nav>

                <div className="p-8 border-t border-zinc-100 bg-zinc-50/30">
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            window.location.href = '/';
                        }}
                        className="w-full flex items-center justify-between p-5 bg-zinc-100 rounded-2xl text-zinc-800 hover:text-red-500 hover:bg-red-50/50 transition-all group"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest">Terminate Access</span>
                        <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-[#fafafa] p-12 custom-scrollbar text-zinc-900">
                <header className="mb-16 flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-800 mb-3">Protocol Level: Master</p>
                        <h2 className="text-4xl font-black text-black tracking-tighter uppercase">
                            {activeTab === 'overview' && 'Network Overview'}
                            {activeTab === 'admins' && 'Admin Governance'}
                            {activeTab === 'users' && 'Universal Directory'}
                            {activeTab === 'logs' && 'System Forensics'}
                            {activeTab === 'syncs' && 'Sync Latency Monitor'}
                        </h2>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => { fetchUsers(); fetchLogs(); }} className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm hover:rotate-180 transition-all duration-500">
                            <RefreshCw size={20} className="text-zinc-800" />
                        </button>
                    </div>
                </header>

                {activeTab === 'overview' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                                <p className="text-[10px] font-black uppercase text-zinc-800 mb-4 tracking-widest">Total Population</p>
                                <p className="text-4xl font-black text-black">{users.length}</p>
                                <div className="mt-4 flex items-center gap-2 text-emerald-600 text-[9px] font-black uppercase">
                                    <Activity size={12} /> Active Nodes
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                                <p className="text-[10px] font-black uppercase text-zinc-800 mb-4 tracking-widest">Administrator Count</p>
                                <p className="text-4xl font-black text-black">{users.filter(u => u.role === 'ADMIN').length}</p>
                                <div className="mt-4 flex items-center gap-2 text-zinc-800 text-[9px] font-black uppercase">
                                    <ShieldCheck size={12} /> Authority Tier 2
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                                <p className="text-[10px] font-black uppercase text-zinc-800 mb-4 tracking-widest">System Health</p>
                                <p className="text-4xl font-black text-emerald-600">OPTIMAL</p>
                                <div className="mt-4 flex items-center gap-2 text-zinc-800 text-[9px] font-black uppercase">
                                    <Server size={12} /> Latency: 24ms
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                                <p className="text-[10px] font-black uppercase text-zinc-800 mb-4 tracking-widest">Security Protocol</p>
                                <p className="text-4xl font-black text-zinc-900">AES-256</p>
                                <div className="mt-4 flex items-center gap-2 text-blue-600 text-[9px] font-black uppercase">
                                    <Shield size={12} /> Encrypted State
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="bg-white p-10 rounded-[3rem] border border-zinc-100 shadow-sm">
                                <h3 className="text-sm font-black uppercase tracking-widest mb-8 border-b border-zinc-50 pb-4 text-black">Recent System Logs</h3>
                                <div className="space-y-6">
                                    {logs.slice(0, 5).map((log, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 hover:bg-zinc-50 rounded-2xl transition-colors">
                                            <div className={`w-2 h-2 mt-1.5 rounded-full ${log.action.includes('DELETE') ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                            <div>
                                                <p className="text-[11px] font-bold text-black uppercase">{log.action}</p>
                                                <p className="text-[10px] text-zinc-800 mt-1 line-clamp-1">{log.details}</p>
                                                <p className="text-[8px] text-zinc-800 mt-2 font-mono uppercase">{new Date(log.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white p-10 rounded-[3rem] border border-zinc-100 shadow-sm">
                                <h3 className="text-sm font-black uppercase tracking-widest mb-8 border-b border-zinc-50 pb-4 text-black">Protocol Compliance</h3>
                                <div className="flex flex-col items-center justify-center py-10">
                                    <div className="w-32 h-32 border-[12px] border-emerald-500 border-t-zinc-100 rounded-full flex items-center justify-center mb-6">
                                        <p className="text-2xl font-black text-black">98%</p>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-800">Security Index Rating</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'admins' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            <div className="lg:col-span-1 space-y-8">
                                <div className="bg-white p-10 rounded-[3rem] border border-zinc-100 shadow-xl border-t-[8px] border-t-black">
                                    <h3 className="text-xs font-black uppercase tracking-widest mb-10 flex items-center gap-3">
                                        <UserPlus size={18} /> Provision Admin
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-800 ml-2">Access Key (Username)</label>
                                            <input 
                                                value={newAdminUsername} 
                                                onChange={e => setNewAdminUsername(e.target.value)}
                                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-black transition-all outline-none text-black"
                                                placeholder="Enter username"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-800 ml-2">Security Hash (Password)</label>
                                            <div className="relative">
                                                <input 
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={newAdminPassword}
                                                    onChange={e => setNewAdminPassword(e.target.value)}
                                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-black transition-all outline-none text-black"
                                                    placeholder="Enter password"
                                                />
                                                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-800 hover:text-black">
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-800 ml-2">Protocol Email</label>
                                            <input 
                                                value={newAdminEmail} 
                                                onChange={e => setNewAdminEmail(e.target.value)}
                                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-black transition-all outline-none text-black"
                                                placeholder="Enter email"
                                            />
                                        </div>
                                        <button 
                                            onClick={createAdmin}
                                            className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:scale-[1.02] active:scale-95 transition-all mt-6"
                                        >
                                            Authorize Access
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-[3rem] border border-zinc-100 shadow-sm overflow-hidden">
                                    <div className="p-8 border-b border-zinc-50 bg-zinc-50/30 flex justify-between items-center">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-black">Active Administrators</h3>
                                        <p className="text-[9px] font-black uppercase text-zinc-800 tracking-widest">{users.filter(u => u.role === 'ADMIN').length} Verified Personnel</p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="text-[10px] font-black uppercase tracking-widest text-zinc-800 border-b border-zinc-50">
                                                    <th className="px-10 py-6">Identity</th>
                                                    <th className="px-10 py-6">Login Profile</th>
                                                    <th className="px-10 py-6">Status</th>
                                                    <th className="px-10 py-6 text-right">Directives</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-50">
                                                {users.filter(u => u.role === 'ADMIN').map(admin => (
                                                    <tr key={admin.id} className="hover:bg-zinc-50/50 transition-colors">
                                                        <td className="px-10 py-8">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center font-black text-black">
                                                                    {admin.username[0].toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black uppercase text-black">{admin.username}</p>
                                                                    <p className="text-[9px] text-zinc-800 mt-0.5">{admin.email || 'No email registered'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-8 font-mono text-[10px] text-zinc-800">
                                                            {admin.last_login ? new Date(admin.last_login).toLocaleString() : 'NEVER LOGGED IN'}
                                                        </td>
                                                        <td className="px-10 py-8">
                                                            <span className={`text-[9px] font-black px-2 py-1 rounded ${admin.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} uppercase tracking-widest`}>
                                                                {admin.is_active ? 'Authorized' : 'Restricted'}
                                                            </span>
                                                        </td>
                                                        <td className="px-10 py-8 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button 
                                                                    onClick={() => toggleUserStatus(admin.id)}
                                                                    className={`p-2.5 rounded-xl transition-all ${admin.is_active ? 'text-zinc-500 hover:text-black hover:bg-zinc-100' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                                                    title={admin.is_active ? 'Revoke Access' : 'Restore Access'}
                                                                >
                                                                    {admin.is_active ? <Lock size={16} /> : <Unlock size={16} />}
                                                                </button>
                                                                <button 
                                                                    onClick={() => deleteUser(admin.id)}
                                                                    className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                                    title="Destroy Profile"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-white rounded-[3rem] border border-zinc-100 shadow-sm overflow-hidden">
                            <div className="p-10 border-b border-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-50/20">
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-black">Universal User Matrix</h3>
                                    <p className="text-[10px] text-zinc-800 mt-1 uppercase tracking-widest">Showing {filteredUsers.length} total system identities</p>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-800" size={18} />
                                    <input 
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="bg-white border border-zinc-200 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold w-full md:w-80 focus:ring-2 focus:ring-black outline-none transition-all text-black"
                                        placeholder="Search identities..."
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-zinc-800 border-b border-zinc-50">
                                            <th className="px-10 py-6">ID</th>
                                            <th className="px-10 py-6">Identity</th>
                                            <th className="px-10 py-6">Access Tier</th>
                                            <th className="px-10 py-6">Origin Node</th>
                                            <th className="px-10 py-6">Status</th>
                                            <th className="px-10 py-6 text-right">Directives</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {filteredUsers.map(u => (
                                            <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-10 py-8 font-mono text-[10px] text-zinc-800">#{u.id}</td>
                                                <td className="px-10 py-8">
                                                    <div>
                                                        <p className="text-sm font-black uppercase text-black">{u.username}</p>
                                                        <p className="text-[9px] text-zinc-800 mt-0.5">{u.email || 'N/A'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                                                        u.role === 'SUPER_ADMIN' ? 'text-purple-600' :
                                                        u.role === 'ADMIN' ? 'text-black' :
                                                        u.role === 'MANAGER' ? 'text-blue-600' :
                                                        'text-zinc-600'
                                                    }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <p className="text-[10px] font-black uppercase text-zinc-800">{u.branch_name || 'Global HQ'}</p>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                        <span className="text-[10px] font-black uppercase text-zinc-800">{u.is_active ? 'Online' : 'Offline'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {u.role !== 'SUPER_ADMIN' && (
                                                            <>
                                                                <button 
                                                                    onClick={() => toggleUserStatus(u.id)}
                                                                    className="p-3 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-xl transition-all"
                                                                >
                                                                    {u.is_active ? <Lock size={16} /> : <Unlock size={16} />}
                                                                </button>
                                                                <button 
                                                                    onClick={() => deleteUser(u.id)}
                                                                    className="p-3 text-zinc-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {(activeTab === 'logs' || activeTab === 'syncs') && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-white rounded-[3rem] border border-zinc-100 shadow-sm overflow-hidden">
                            <div className="p-10 border-b border-zinc-50 bg-zinc-50/20 flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-black">
                                        {activeTab === 'logs' ? 'Network Forensics Ledger' : 'Synchronization Intelligence'}
                                    </h3>
                                    <p className="text-[10px] text-zinc-800 mt-1 uppercase tracking-widest">
                                        Aggregated from {logs.length} global records
                                    </p>
                                </div>
                                <button onClick={fetchLogs} className="flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all text-black">
                                    <RefreshCw size={14} /> Refresh Intelligence
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-zinc-800 border-b border-zinc-50">
                                            <th className="px-10 py-6">Timestamp</th>
                                            <th className="px-10 py-6">Subject</th>
                                            <th className="px-10 py-6">Action Protocol</th>
                                            <th className="px-10 py-6">Diagnostic Payload</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {logs
                                            .filter(log => activeTab === 'syncs' ? log.action.includes('SYNC') || log.action.includes('SALE') : true)
                                            .map((log, idx) => (
                                            <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-10 py-8 font-mono text-[10px] text-zinc-800 uppercase">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-zinc-50 rounded-lg flex items-center justify-center text-[10px] font-black text-black border border-zinc-100">
                                                            {log.username ? log.username[0].toUpperCase() : 'S'}
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-black uppercase text-black">{log.username || 'System'}</p>
                                                            <p className="text-[8px] text-zinc-800 uppercase tracking-widest">{log.role}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className={`text-[9px] font-black px-2 py-1 rounded bg-zinc-100 text-zinc-900 uppercase tracking-widest`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <p className="text-[11px] text-zinc-900 font-medium max-w-lg">{log.details}</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SuperAdminDashboard;

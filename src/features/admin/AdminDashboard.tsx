import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../app/store';
import { setRates } from '../../app/store';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { token, user, rates } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [goldPrice, setGoldPrice] = useState(rates?.gold_price || 2000);
    const [forexRate, setForexRate] = useState(rates?.forex_rate || 3800);
    
    // User provisioning state
    const [newUsername, setNewUsername] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [role, setRole] = useState('MANAGER');
    const [selectedBranch, setSelectedBranch] = useState<string>('');

    // Branch state
    const [branchName, setBranchName] = useState('');
    const [xFactor, setXFactor] = useState(92.0);

    // Edit states
    const [editingBranch, setEditingBranch] = useState<any>(null);
    const [editingUser, setEditingUser] = useState<any>(null);

    const [branches, setBranches] = useState<any[]>([]);
    const [usersList, setUsersList] = useState<any[]>([]);
    const [allSales, setAllSales] = useState<any[]>([]);

    useEffect(() => {
        if (user?.role === 'MANAGER') {
            navigate('/manager');
        } else if (user?.role !== 'ADMIN') {
            navigate('/pos');
        } else {
            fetchBranches();
            fetchUsers();
            fetchGlobalSales();
        }
    }, [user, navigate]);

    const fetchBranches = async () => {
        const res = await axios.get('http://127.0.0.1:8000/api/branches/', { headers: { Authorization: `Bearer ${token}` } });
        setBranches(res.data);
    };

    const fetchUsers = async () => {
        const res = await axios.get('http://127.0.0.1:8000/api/users/', { headers: { Authorization: `Bearer ${token}` } });
        setUsersList(res.data);
    };

    const fetchGlobalSales = async () => {
        const res = await axios.get('http://127.0.0.1:8000/api/sales/', { headers: { Authorization: `Bearer ${token}` } });
        setAllSales(res.data);
    };

    const updateRates = async () => {
        try {
            const res = await axios.post('http://127.0.0.1:8000/api/rates/', { gold_price: goldPrice, forex_rate: forexRate }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(setRates(res.data));
            alert('Global market parity updated.');
        } catch(e) { alert('Failed.'); }
    };

    const createUser = async () => {
        try {
            await axios.post('http://127.0.0.1:8000/api/users/create/', { 
                username: newUsername, email: newEmail, password: newPassword, role: role, branch: selectedBranch || null
            }, { headers: { Authorization: `Bearer ${token}` } });
            setNewUsername(''); setNewEmail(''); setNewPassword('');
            fetchUsers();
            alert('Account Authorized.');
        } catch(e) { alert('Error.'); }
    };

    const createBranch = async () => {
        try {
            await axios.post('http://127.0.0.1:8000/api/branches/create/', { name: branchName, x_factor: xFactor }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBranchName(''); setXFactor(92.0);
            fetchBranches();
            alert('Branch Node Registered.');
        } catch(e) { alert('Error.'); }
    };

    const updateBranch = async () => {
        try {
            await axios.patch(`http://127.0.0.1:8000/api/branches/${editingBranch.id}/`, editingBranch, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEditingBranch(null); fetchBranches();
            alert('Branch Node Updated.');
        } catch(e) { alert('Error.'); }
    };

    const updateUser = async () => {
        try {
            await axios.patch(`http://127.0.0.1:8000/api/users/${editingUser.id}/`, editingUser, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEditingUser(null); fetchUsers();
            alert('Identity Record Updated.');
        } catch(e) { alert('Error.'); }
    };

    const deleteBranch = async (id: number) => {
        if (!window.confirm('Decommission this branch?')) return;
        try { await axios.delete(`http://127.0.0.1:8000/api/branches/${id}/`, { headers: { Authorization: `Bearer ${token}` } }); fetchBranches(); } catch(e) { alert('Failed.'); }
    };

    const deleteUser = async (id: number) => {
        if (!window.confirm('Revoke access for this user?')) return;
        try { await axios.delete(`http://127.0.0.1:8000/api/users/${id}/`, { headers: { Authorization: `Bearer ${token}` } }); fetchUsers(); } catch(e) { alert('Failed.'); }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 p-4 md:p-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800 pb-6 gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tighter text-white italic">CENTRAL COMMAND</h2>
                    <div className="text-zinc-500 font-mono text-[10px] mt-2 uppercase tracking-[0.3em]">High-Level Enterprise Audit & Node Governance</div>
                </div>
            </div>

            {/* Global Constants Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="card lg:col-span-2 border-l-4 border-white bg-zinc-900/50">
                    <h3 className="text-sm font-black mb-6 text-zinc-500 uppercase tracking-widest">Global Market Parity</h3>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] uppercase text-zinc-600 font-bold">Spot Gold (USD/oz)</label>
                            <input type="number" step="0.01" value={goldPrice} onChange={e => setGoldPrice(Number(e.target.value))} className="bg-transparent border-b border-zinc-800 text-3xl font-black text-white w-full outline-none p-1" />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] uppercase text-zinc-600 font-bold">Forex Parity (UGX:USD)</label>
                            <input type="number" step="0.01" value={forexRate} onChange={e => setForexRate(Number(e.target.value))} className="bg-transparent border-b border-zinc-800 text-3xl font-black text-white w-full outline-none p-1 text-right" />
                        </div>
                    </div>
                    <button onClick={updateRates} className="btn-primary w-full mt-8 py-3 text-[10px] font-black uppercase">Refresh Market Context</button>
                </div>

                <div className="card space-y-4 border-zinc-800">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Registrar: New node</h3>
                    <input type="text" placeholder="Branch Name" value={branchName} onChange={e => setBranchName(e.target.value)} className="input-field text-xs bg-black" />
                    <input type="number" step="0.01" placeholder="X-Factor" value={xFactor} onChange={e => setXFactor(Number(e.target.value))} className="input-field text-xs bg-black" />
                    <button onClick={createBranch} className="btn-primary w-full py-2 text-[10px] font-black">Register Node</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Branch Governance */}
                <div className="card space-y-6">
                    <h3 className="text-xl font-bold italic tracking-tighter uppercase border-b border-zinc-800 pb-2">Branch Governance</h3>
                    <div className="space-y-3">
                        {branches.map(b => (
                            <div key={b.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg group hover:border-white/20 transition-all">
                                {editingBranch?.id === b.id ? (
                                    <div className="space-y-3">
                                        <input type="text" value={editingBranch.name} onChange={e => setEditingBranch({...editingBranch, name: e.target.value})} className="input-field text-xs" />
                                        <input type="number" value={editingBranch.x_factor} onChange={e => setEditingBranch({...editingBranch, x_factor: e.target.value})} className="input-field text-xs" />
                                        <div className="flex gap-2">
                                            <button onClick={updateBranch} className="btn-primary flex-1 py-1 text-[10px]">SAVE</button>
                                            <button onClick={() => setEditingBranch(null)} className="flex-1 py-1 text-[10px] bg-zinc-800 text-white rounded">CANCEL</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-white font-black text-md">{b.name}</div>
                                            <div className="text-[10px] text-zinc-500 font-mono tracking-widest font-black uppercase">XFACTOR: {b.x_factor}</div>
                                        </div>
                                        <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => setEditingBranch(b)} className="text-blue-500 text-[10px] font-black uppercase">Edit</button>
                                            <button onClick={() => deleteBranch(b.id)} className="text-red-900 hover:text-red-500 text-[10px] font-black uppercase">Decomm</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Identity Licensing */}
                <div className="card space-y-6">
                    <h3 className="text-xl font-bold italic tracking-tighter uppercase border-b border-zinc-800 pb-2">Identity Licensing</h3>
                    <div className="grid grid-cols-2 gap-3 pb-6 border-b border-zinc-800">
                        <input type="text" placeholder="Username" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="input-field text-xs bg-black h-9" />
                        <input type="email" placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="input-field text-xs bg-black h-9" />
                        <input type="password" placeholder="Cipher" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field text-xs bg-black h-9" />
                        <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className="input-field text-xs bg-black h-9">
                            <option value="">-- NO NODE --</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                        <select value={role} onChange={e => setRole(e.target.value)} className="input-field text-xs bg-black col-span-2 h-9 font-black uppercase">
                            <option value="MANAGER">Manager Control</option>
                            <option value="STAFF">Terminal Staff</option>
                        </select>
                        <button onClick={createUser} className="btn-primary py-2 text-[10px] font-black col-span-2">Authorize Access</button>
                    </div>

                    <div className="space-y-3">
                        {usersList.map(u => (
                            <div key={u.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded group">
                                {editingUser?.id === u.id ? (
                                    <div className="space-y-3">
                                        <input type="text" value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} className="input-field text-[10px]" />
                                        <input type="email" value={editingUser.email} onChange={setEditingUser ? e => setEditingUser({...editingUser, email: e.target.value}) : undefined} className="input-field text-[10px]" />
                                        <div className="flex gap-2">
                                            <button onClick={updateUser} className="btn-primary flex-1 py-1 text-[10px]">SAVE</button>
                                            <button onClick={() => setEditingUser(null)} className="flex-1 py-1 text-[10px] bg-zinc-800 text-white rounded">CANCEL</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-white font-bold text-sm tracking-tighter">{u.username}</div>
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${u.role === 'ADMIN' ? 'bg-red-500 text-white' : 'bg-zinc-700 text-white'}`}>{u.role}</span>
                                            </div>
                                            <div className="text-[10px] text-zinc-600 font-mono italic">{u.branch_name || 'Global HQ'}</div>
                                        </div>
                                        <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => setEditingUser(u)} className="text-blue-500 text-[10px] font-black uppercase">Edit</button>
                                            <button onClick={() => deleteUser(u.id)} className="text-red-900 hover:text-red-500 text-[10px] font-black uppercase">Revoke</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Audit Log */}
            <div className="card p-0 overflow-hidden shadow-2xl border-zinc-800">
                <div className="bg-zinc-900 p-4 border-b border-zinc-800">
                    <h3 className="text-lg font-black italic tracking-tighter uppercase text-white">Global Enterprise Auditor</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[11px]">
                        <thead>
                            <tr className="border-b border-zinc-800 text-zinc-600 uppercase text-[9px] tracking-[0.2em] bg-black/40">
                                <th className="p-4">Timestamp</th><th className="p-4">Origin/Vendor</th><th className="p-4">Identity</th><th className="p-4">Material Spec</th><th className="p-4 text-right">Settlement (USD)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allSales.map(sale => (
                                <tr key={sale.id} className="border-b border-zinc-900 hover:bg-white/5 transition-all">
                                    <td className="p-4 text-zinc-500">{new Date(sale.created_at).toLocaleString()}</td>
                                    <td className="p-4"><div className="text-white font-bold uppercase">{sale.vendor || 'UNKNOWN'}</div><div className="text-[9px] text-zinc-700 font-black tracking-widest">{sale.branch_name}</div></td>
                                    <td className="p-4 text-zinc-300">{sale.staff_name}</td>
                                    <td className="p-4"><div className="text-zinc-400 font-bold">{sale.product_name}</div><div className="text-[9px] text-zinc-700">{sale.actual_process_weight}g @ {sale.actual_product_quality}%</div></td>
                                    <td className="p-4 text-right"><div className="text-white font-black text-sm">${Number(sale.subtotal).toLocaleString()}</div><div className="text-[8px] text-zinc-800 font-black">X-FACTOR: {sale.x_factor}</div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

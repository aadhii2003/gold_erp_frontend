import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useNavigate } from 'react-router-dom';

const ManagerDashboard = () => {
    const { token, user } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();
    
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
        try {
            await axios.post('http://127.0.0.1:8000/api/users/create/', { 
                username: newUsername, 
                email: newEmail,
                password: newPassword, 
                role: 'STAFF' 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Staff Authorized.');
            setNewUsername('');
            setNewEmail('');
            setNewPassword('');
            fetchStaff();
        } catch(e) { alert('Error creating staff.'); }
    };

    const deleteStaff = async (id: number) => {
        if (!window.confirm('Deauthorize this terminal?')) return;
        try {
            await axios.delete(`http://127.0.0.1:8000/api/users/${id}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchStaff();
        } catch(e) { alert('Operation failed.'); }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 p-4 md:p-0">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter italic">MANAGER CONSOLE</h2>
                    <div className="text-zinc-500 font-mono text-[10px] mt-1 uppercase tracking-widest">Node Ownership: {user?.branch_name || 'Assigned Branch'}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <div className="card h-fit border-l-4 border-white bg-zinc-900 shadow-xl">
                        <h3 className="text-md font-bold mb-4 uppercase tracking-[0.2em] text-zinc-500">PROVISION TERMINAL</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Access Username" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="input-field text-xs" />
                            <input type="email" placeholder="Email Contact" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="input-field text-xs" />
                            <input type="password" placeholder="Terminal Passkey" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field text-xs" />
                            <button onClick={createStaff} className="btn-primary w-full py-3 text-[10px] font-black uppercase">Authorize Terminal</button>
                        </div>
                    </div>

                    <div className="card bg-black/40 border-zinc-800">
                        <h3 className="text-sm font-bold mb-4 text-zinc-500 uppercase tracking-widest">ACTIVE TERMINALS</h3>
                        <div className="space-y-3">
                            {staffList.filter(s => s.role === 'STAFF').map(s => (
                                <div key={s.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded flex justify-between items-center group">
                                    <div className="space-y-1">
                                        <div className="font-bold text-white text-xs">{s.username}</div>
                                        <div className="text-[8px] text-zinc-600 font-mono italic">Seen: {s.last_login ? new Date(s.last_login).toLocaleDateString() : 'Never'}</div>
                                    </div>
                                    <button onClick={() => deleteStaff(s.id)} className="opacity-0 group-hover:opacity-100 text-red-900 hover:text-red-500 text-[10px] uppercase font-black transition-all">Revoke</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card lg:col-span-3 border-t-4 border-zinc-500 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold italic tracking-tighter uppercase">Branch Node Ledger</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-mono text-[11px]">
                            <thead>
                                <tr className="border-b border-zinc-800 text-zinc-600 uppercase text-[9px] tracking-[0.2em]">
                                    <th className="pb-3 px-2">Date/Time</th>
                                    <th className="pb-3 px-2">Terminal</th>
                                    <th className="pb-3 px-2">Material Info</th>
                                    <th className="pb-3 px-2">Purity/Density</th>
                                    <th className="pb-3 px-2">Metric (g)</th>
                                    <th className="pb-3 px-2 text-right">Settlement (USD)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map(sale => (
                                    <tr key={sale.id} className="border-b border-zinc-900 hover:bg-zinc-900/40 group transition-all">
                                        <td className="py-4 px-2 text-zinc-500">
                                            {new Date(sale.created_at).toLocaleDateString()}<br/>
                                            <span className="text-[9px]">{new Date(sale.created_at).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="py-4 px-2 text-zinc-300 font-bold">{sale.staff_name}</td>
                                        <td className="py-4 px-2">
                                            <div className="text-white font-bold">{sale.product_name}</div>
                                            <div className="text-[9px] text-zinc-600 italic">Gross WT: {sale.gross_weight}g</div>
                                        </td>
                                        <td className="py-4 px-2">
                                            <div className="text-blue-500 font-black">{Number(sale.actual_product_quality).toFixed(2)}% PUR</div>
                                            <div className="text-[9px] text-zinc-700">{Number(sale.density).toFixed(3)} ρ</div>
                                        </td>
                                        <td className="py-4 px-2 text-zinc-400">{Number(sale.quantity_grams).toFixed(3)}g</td>
                                        <td className="py-4 px-2 text-right">
                                            <div className="text-white font-black">${Number(sale.subtotal).toLocaleString()}</div>
                                            <div className="text-green-900 text-[9px] font-black">{Number(sale.total_ugx).toLocaleString()} /=</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;

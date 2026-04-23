import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { calculateDensity, calculatePurity } from '../../utils/calculations';
import { saveSaleOffline } from '../../db/indexedDB';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { 
    LayoutDashboard, 
    Calculator, 
    History, 
    LogOut,
    CheckCircle2,
    DollarSign,
    Scale,
    Search,
    ChevronRight,
    TrendingUp
} from 'lucide-react';

const POS = () => {
    const { token, user } = useSelector((state: RootState) => state.auth);
    const branchXFactor = (user as any)?.x_factor || 92.0;

    const [activeTab, setActiveTab] = useState('billing');

    // Const Lists
    const [uoms, setUoms] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);

    // RFQ Section
    const [vendor, setVendor] = useState('');
    const [purchaseMethod, setPurchaseMethod] = useState('');
    const [marketPriceCurrency, setMarketPriceCurrency] = useState('USD');
    const [marketPrice, setMarketPrice] = useState<number | ''>(0);
    const [rfqDiscount, setRfqDiscount] = useState<number | ''>(0);
    const [marketPriceUnit, setMarketPriceUnit] = useState('g');

    // Header Metadata
    const [orderDeadline, setOrderDeadline] = useState('');
    const [expectedArrival, setExpectedArrival] = useState('');
    const [transactionCurrency, setTransactionCurrency] = useState('USD');
    const [currencyRate, setCurrencyRate] = useState<number | ''>(3800);
    const [transactionUnit, setTransactionUnit] = useState('t');
    const [conversionMarketUnit, setConversionMarketUnit] = useState<number | ''>(0.38);
    const [paymentRef, setPaymentRef] = useState('Paid Unfixed Amount');
    const [paidAmount, setPaidAmount] = useState<number | ''>(0);

    // Product Section
    const [productName, setProductName] = useState('Gold Bar');
    const [description, setDescription] = useState('');
    const [grossWeight, setGrossWeight] = useState<number | ''>('');
    const [actualProcessWeight, setActualProcessWeight] = useState<number | ''>('');
    const [secondProcessWeight, setSecondProcessWeight] = useState<number | ''>('');

    const [salesLedger, setSalesLedger] = useState<any[]>([]);

    useEffect(() => {
        fetchMySales();
        fetchConstants();
    }, []);

    const fetchConstants = async () => {
        try {
            const [uResp, cResp] = await Promise.all([
                axios.get('http://127.0.0.1:8000/api/uoms/', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://127.0.0.1:8000/api/currencies/', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setUoms(uResp.data);
            setCurrencies(cResp.data);
        } catch(e) {}
    };

    const fetchMySales = async () => {
        if (!token) return;
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/sales/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSalesLedger(res.data);
        } catch (e) {}
    };

    // Derived Calculations
    const netPrice = (marketPrice !== '' && rfqDiscount !== '') ? Number(marketPrice) + Number(rfqDiscount) : 0;
    const processLoss = (grossWeight !== '' && actualProcessWeight !== '') ? Number(grossWeight) - Number(actualProcessWeight) : 0;
    const density = (actualProcessWeight !== '' && secondProcessWeight !== '') ? calculateDensity(Number(actualProcessWeight), Number(secondProcessWeight)) : 0;
    const computedPurity = calculatePurity(density);
    const unitPrice = netPrice * (computedPurity / branchXFactor);
    const quantity = actualProcessWeight !== '' ? Number(actualProcessWeight) : 0;
    const subtotal = (unitPrice * (quantity / 11.664)); 
    const balance = subtotal - (paidAmount !== '' ? Number(paidAmount) : 0);
    const totalUgx = Math.round((subtotal * Number(currencyRate || 1)) / 1000) * 1000;

    const handleSave = async () => {
        if (actualProcessWeight === '') return alert('Weight Required');
        const sale = {
            id: uuidv4(),
            vendor,
            purchase_method: purchaseMethod,
            market_price_currency: marketPriceCurrency,
            market_price: Number(marketPrice),
            discount_addition: Number(rfqDiscount),
            net_price: netPrice,
            market_price_unit: marketPriceUnit,
            order_deadline: orderDeadline || null,
            expected_arrival: expectedArrival || null,
            transaction_currency: transactionCurrency,
            currency_rate: Number(currencyRate),
            transaction_unit: transactionUnit,
            conversion_market_unit: Number(conversionMarketUnit),
            x_factor: branchXFactor,
            payment_ref: paymentRef,
            paid_amount: Number(paidAmount),
            balance: balance,
            product_name: productName,
            description,
            gross_weight: Number(grossWeight),
            actual_process_weight: Number(actualProcessWeight),
            second_process_weight: Number(secondProcessWeight),
            process_loss: processLoss,
            density,
            actual_product_quality: computedPurity,
            unit_price: unitPrice,
            subtotal: subtotal,
            total_ugx: totalUgx,
        };
        await saveSaleOffline(sale);
        if (navigator.onLine) {
            window.dispatchEvent(new Event('online'));
            setTimeout(fetchMySales, 1000);
        }
        alert('Bill generated and saved successfully.');
        
        // Reset Weights for next bill
        setGrossWeight('');
        setActualProcessWeight('');
        setSecondProcessWeight('');
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
                    <h1 className="text-xl font-bold text-white tracking-tight">Staff Terminal</h1>
                    <p className="text-xs text-zinc-600 mt-1 uppercase font-medium">{user?.username}</p>
                </div>

                <nav className="flex-1">
                    <SidebarItem id="billing" label="POS Billing" icon={Calculator} />
                    <SidebarItem id="history" label="Sales History" icon={History} />
                    <SidebarItem id="overview" label="Daily Summary" icon={LayoutDashboard} />
                </nav>

                <div className="p-6 border-t border-zinc-900">
                    <button 
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            window.location.href = '/';
                        }}
                        className="w-full flex items-center gap-3 text-zinc-400 hover:text-red-400 transition-colors py-2 text-sm font-medium"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8 bg-zinc-950">
                {/* Billing Tab */}
                {activeTab === 'billing' && (
                    <div className="space-y-8 animate-in fade-in duration-300 max-w-6xl">
                        {/* Transaction Header */}
                        <div className="flex justify-between items-end border-b border-zinc-900 pb-6">
                            <div>
                                <h2 className="text-2xl font-semibold text-white">Create New Bill</h2>
                                <p className="text-sm text-zinc-500 mt-1">Configure transaction rfq and product specs</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-zinc-600 uppercase font-bold tracking-widest">Total Settlement</p>
                                <p className="text-3xl font-bold text-white">${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                                <p className="text-emerald-500 font-medium">{totalUgx.toLocaleString()} UGX</p>
                            </div>
                        </div>

                        {/* Section 1: RFQ & Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="card space-y-6">
                                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">1. Procurement Context</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-500">Vendor Name</label>
                                        <input type="text" value={vendor} onChange={e => setVendor(e.target.value)} className="input-field" placeholder="Client identity" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-500">Purchase Method</label>
                                        <input type="text" value={purchaseMethod} onChange={e => setPurchaseMethod(e.target.value)} className="input-field" placeholder="e.g. Spot" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-500">Market Price (USD)</label>
                                        <input type="number" value={marketPrice} onChange={e => setMarketPrice(Number(e.target.value))} className="input-field font-semibold text-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-500">Adjustment +/-</label>
                                        <input type="number" value={rfqDiscount} onChange={e => setRfqDiscount(Number(e.target.value))} className="input-field" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-500">Currency Rate</label>
                                        <input type="number" value={currencyRate} onChange={e => setCurrencyRate(Number(e.target.value))} className="input-field" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-500">Paid Amount (USD)</label>
                                        <input type="number" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} className="input-field border-blue-900/50" />
                                    </div>
                                </div>
                            </div>

                            <div className="card space-y-6">
                                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">2. Product Specification</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1 col-span-2">
                                        <label className="text-xs text-zinc-500">Product Title</label>
                                        <input type="text" value={productName} onChange={e => setProductName(e.target.value)} className="input-field" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-500 font-medium text-white">Actual Weight (g)</label>
                                        <input type="number" value={actualProcessWeight} onChange={e => setActualProcessWeight(Number(e.target.value))} className="input-field border-zinc-700 bg-zinc-950 text-emerald-400 text-lg font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-500 font-medium text-white">Second Weight (g)</label>
                                        <input type="number" value={secondProcessWeight} onChange={e => setSecondProcessWeight(Number(e.target.value))} className="input-field border-zinc-700 bg-zinc-950 text-blue-400 text-lg font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-500">Gross Weight (g)</label>
                                        <input type="number" value={grossWeight} onChange={e => setGrossWeight(Number(e.target.value))} className="input-field" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-500">Loss (g)</label>
                                        <div className="input-field bg-zinc-900/50 flex items-center text-zinc-500">{processLoss.toFixed(3)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary Bar */}
                        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl flex flex-wrap justify-between items-center gap-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
                                    <Scale size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase font-bold">Analysis Density</p>
                                    <p className="text-xl font-semibold text-white">{density.toFixed(3)} ρ</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-500">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase font-bold">Calculated Purity</p>
                                    <p className="text-xl font-semibold text-white">{computedPurity.toFixed(2)}%</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-500/10 rounded-full text-purple-500">
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase font-bold">Adjusted Unit Price</p>
                                    <p className="text-xl font-semibold text-white">${unitPrice.toFixed(2)} /g</p>
                                </div>
                            </div>
                            <button onClick={handleSave} className="btn-primary px-12 py-4 flex items-center gap-3">
                                Generate Bill <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="mb-6 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-white">Your Recent Transactions</h2>
                        </div>
                        <div className="card p-0 overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-zinc-800 text-zinc-500 text-xs font-medium bg-zinc-900/50">
                                        <th className="p-4">Time</th>
                                        <th className="p-4">Client</th>
                                        <th className="p-4">Product Specs</th>
                                        <th className="p-4 text-right">Settlement</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {salesLedger.map(sale => (
                                        <tr key={sale.id} className="border-b border-zinc-900 hover:bg-zinc-900/40 transition-colors">
                                            <td className="p-4 text-zinc-500">{new Date(sale.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                            <td className="p-4">
                                                <p className="text-white font-medium">{sale.vendor || 'Private Client'}</p>
                                                <p className="text-xs text-zinc-600">{sale.purchase_method}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-zinc-300">{sale.product_name}</p>
                                                <p className="text-xs text-zinc-600">{sale.actual_process_weight}g @ {Number(sale.actual_product_quality).toFixed(2)}%</p>
                                            </td>
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

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="card p-6 border-l-4 border-emerald-500">
                                <TrendingUp className="text-emerald-500 mb-4" size={24} />
                                <p className="text-3xl font-bold text-white">${salesLedger.reduce((acc, s) => acc + Number(s.subtotal), 0).toLocaleString()}</p>
                                <p className="text-sm text-zinc-500 mt-1">Today's Revenue (USD)</p>
                            </div>
                            <div className="card p-6 border-l-4 border-blue-500">
                                <Calculator className="text-blue-500 mb-4" size={24} />
                                <p className="text-3xl font-bold text-white">{salesLedger.length}</p>
                                <p className="text-sm text-zinc-500 mt-1">Transaction Count</p>
                            </div>
                            <div className="card p-6 border-l-4 border-purple-500">
                                <Scale className="text-purple-500 mb-4" size={24} />
                                <p className="text-3xl font-bold text-white">{salesLedger.reduce((acc, s) => acc + Number(s.actual_process_weight), 0).toFixed(2)}g</p>
                                <p className="text-sm text-zinc-500 mt-1">Total Gold Weight</p>
                            </div>
                        </div>
                        
                        <div className="card">
                            <h3 className="text-lg font-medium text-white mb-6">Performance Insights</h3>
                            <p className="text-zinc-500 text-sm">Your terminal current productivity is at target. Ensure all pending offline sales are synced once connectivity is restored.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default POS;


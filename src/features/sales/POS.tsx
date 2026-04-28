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
    TrendingUp,
    Command,
    Clock,
    User,
    Sun,
    Moon,
    Menu,
    X,
    BarChart3,
    ArrowLeftRight,
    FileDown,
    Eye
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


const SidebarItem = ({ id, label, icon: Icon, activeTab, onClick }: { id: string, label: string, icon: any, activeTab: string, onClick: (id: string) => void }) => (
    <button
        onClick={() => onClick(id)}
        className={`w-full flex items-center gap-3 px-6 py-4 transition-all relative group ${activeTab === id
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary)/0.2)] rounded-2xl scale-[1.02]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/0.5)] rounded-2xl'
            }`}
    >
        <Icon size={18} />
        <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
    </button>
);

const POS = () => {
    const { token, user } = useSelector((state: RootState) => state.auth);
    const [branchXFactor, setBranchXFactor] = useState(Number((user as any)?.x_factor || 92.0));

    const [activeTab, setActiveTab] = useState('overview');
    const [theme, setTheme] = useState('light');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Const Lists
    const [uoms, setUoms] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [matrixList, setMatrixList] = useState<any[]>([]);

    // RFQ Section
    const [clientName, setClientName] = useState('');
    const [filingDate, setFilingDate] = useState(new Date().toISOString().split('T')[0]);
    const [marketCurrency, setMarketCurrency] = useState('USD');
    const [marketPrice, setMarketPrice] = useState<number | ''>('');
    const [discountAdditions, setDiscountAdditions] = useState<number | ''>(0);
    const [materialUnitInput, setMaterialUnitInput] = useState('Grams');
    const [changeCurrency, setChangeCurrency] = useState('AED');
    const [changeCurrencyRate, setChangeCurrencyRate] = useState<number | ''>(3850);
    const [taxes, setTaxes] = useState<number | ''>(0);

    // Product Section
    const [products, setProducts] = useState<any[]>([
        {
            id: uuidv4(),
            productName: 'Gold Bar',
            description: 'Premium Quality',
            grossWeight: '',
            actualProcessWeight: '',
            secondProcessWeight: '',
            manualFirstProcess: '',
            manualPurity: '',
            uom: 'Tola',
            taxes: 0
        }
    ]);
    const [paidAmount, setPaidAmount] = useState<number | ''>('');
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastSavedSale, setLastSavedSale] = useState<any>(null);
    const [isViewingMode, setIsViewingMode] = useState(false);

    const [salesLedger, setSalesLedger] = useState<any[]>([]);

    useEffect(() => {
        fetchMySales();
        fetchConstants();
    }, []);

    const fetchConstants = async () => {
        try {
            const [uResp, cResp, mResp] = await Promise.all([
                axios.get('http://127.0.0.1:8000/api/uoms/', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://127.0.0.1:8000/api/currencies/', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://127.0.0.1:8000/api/density-purity/', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setUoms(uResp.data);
            setCurrencies(cResp.data);
            setMatrixList(mResp.data);
        } catch (e) { }
    };

    const fetchMySales = async () => {
        if (!token) return;
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/sales/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSalesLedger(res.data);
        } catch (e) { }
    };

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
        document.documentElement.classList.toggle('dark');
    };

    const addProduct = () => {
        setProducts([...products, {
            id: uuidv4(),
            productName: 'New Product',
            description: '',
            grossWeight: '',
            actualProcessWeight: '',
            secondProcessWeight: '',
            manualFirstProcess: '',
            manualPurity: '',
            uom: 'Tola',
            taxes: 0
        }]);
    };

    const removeProduct = (id: string) => {
        if (products.length > 1) {
            setProducts(products.filter(p => p.id !== id));
        }
    };

    const updateProduct = (id: string, field: string, value: any) => {
        setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const truncate2 = (num: number) => Math.trunc(num * 100) / 100;

    // Derived Calculations
    const netPrice = Number(marketPrice || 0) + Number(discountAdditions || 0);
    const tolaRate = truncate2(netPrice / 3);

    const computedProducts = products.map(p => {
        const actualWt = Number(p.actualProcessWeight || 0);
        const secondWt = Number(p.secondProcessWeight || 0);
        const grossWt = Number(p.grossWeight || 0);

        const processLoss = (grossWt > 0 && actualWt > 0) ? grossWt - actualWt : 0;
        const density = (actualWt > 0 && secondWt > 0) ? calculateDensity(actualWt, secondWt) : 0;

        let computedPurity = 0;
        if (density > 0) {
            if (matrixList && matrixList.length > 0) {
                const closest = matrixList.reduce((prev, curr) => {
                    return (Math.abs(Number(curr.density) - density) < Math.abs(Number(prev.density) - density) ? curr : prev);
                });
                computedPurity = Number(closest.purity);
            } else {
                // Fallback to physics-based calculation if matrix is empty
                computedPurity = calculatePurity(density);
            }
        }

        const finalPurity = p.manualPurity !== '' && Number(p.manualPurity) > 0 ? Number(p.manualPurity) : computedPurity;
        const weightToUse = p.manualFirstProcess !== '' && Number(p.manualFirstProcess) > 0 ? Number(p.manualFirstProcess) : (actualWt > 0 ? actualWt : grossWt);
        const tolaQty = truncate2(weightToUse / 11.664);

        const safeXFactor = branchXFactor > 0 ? branchXFactor : 92.0;
        const unitPrice = truncate2((tolaRate * finalPurity) / safeXFactor);
        const subtotal = truncate2((unitPrice * tolaQty) + Number(p.taxes || 0));

        return { ...p, processLoss, density, finalPurity, weightToUse, tolaQty, unitPrice, subtotal };
    });

    const totalSubtotal = computedProducts.reduce((acc, p) => acc + p.subtotal, 0);
    const subtotal = totalSubtotal;
    const balance = totalSubtotal - (paidAmount !== '' ? Number(paidAmount) : 0);
    const totalTargetCurrency = Math.round((totalSubtotal * Number(changeCurrencyRate || 1)));

    const handlePreview = () => {
        if (computedProducts.some(p => p.weightToUse === 0)) return alert('All products must have weight');
        const sale = {
            id: uuidv4(),
            client_name: clientName,
            filing_date: filingDate,
            market_currency: marketCurrency,
            market_price: Number(marketPrice),
            discount_additions: Number(discountAdditions),
            net_price: netPrice,
            tola_rate: tolaRate,
            material_unit: materialUnitInput,
            change_currency: changeCurrency,
            change_currency_rate: Number(changeCurrencyRate),
            x_factor: branchXFactor,
            paid_amount: Number(paidAmount),
            balance: balance,
            subtotal: totalSubtotal,
            total_target_currency: totalTargetCurrency,
            products: computedProducts,
            created_at: new Date().toISOString()
        };
        setLastSavedSale(sale);
        setIsViewingMode(false);
        setShowReceipt(true);
    };

    const handleViewSale = (saleFromBackend: any) => {
        const mappedSale = {
            ...saleFromBackend,
            client_name: saleFromBackend.vendor,
            market_price: saleFromBackend.market_price,
            discount_additions: saleFromBackend.discount_addition,
            change_currency_rate: saleFromBackend.currency_rate,
            tola_rate: saleFromBackend.tola_rate,
            market_currency: saleFromBackend.market_price_currency || 'USD',
            change_currency: saleFromBackend.transaction_currency || 'USD',
            subtotal: saleFromBackend.subtotal,
            total_target_currency: saleFromBackend.total_ugx,
            products: [
                {
                    id: 'product-1',
                    actualProcessWeight: saleFromBackend.actual_process_weight,
                    tolaQty: saleFromBackend.qty_tolas,
                    finalPurity: saleFromBackend.actual_product_quality,
                    unitPrice: saleFromBackend.unit_price,
                    subtotal: saleFromBackend.subtotal
                }
            ]
        };
        setLastSavedSale(mappedSale);
        setIsViewingMode(true);
        setShowReceipt(true);
    };

    const handleConfirmAndSave = async () => {
        if (!lastSavedSale) return;
        await saveSaleOffline(lastSavedSale);

        if (navigator.onLine) {
            window.dispatchEvent(new Event('online'));
            setTimeout(fetchMySales, 1000);
        }

        // Reset for next bill
        setProducts([
            {
                id: uuidv4(),
                productName: 'Gold Bar',
                description: 'Premium Quality',
                grossWeight: '',
                actualProcessWeight: '',
                secondProcessWeight: '',
                manualFirstProcess: '',
                manualPurity: '',
                uom: 'Tola',
                taxes: 0
            }
        ]);
        setPaidAmount('');

        setShowReceipt(false);
    };

    const downloadPDF = async () => {
        const element = document.getElementById('receipt-content');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                height: element.scrollHeight,
                windowHeight: element.scrollHeight,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById('receipt-content');
                    if (clonedElement) {
                        clonedElement.style.overflow = 'visible';
                        clonedElement.style.height = 'auto';
                    }
                }
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Bill_${lastSavedSale.client_name || 'Sale'}_${lastSavedSale.id.split('-')[0]}.pdf`);
        } catch (e) {
            alert('PDF generation failed. Please use Print -> Save as PDF.');
        }
    };

    return (
        <div className="flex h-screen bg-[hsl(var(--background))] font-sans overflow-hidden transition-all duration-300">
            <aside
                className={`fixed lg:relative z-[60] h-full flex flex-col bg-[hsl(var(--card))] no-print transition-all duration-500 ease-in-out shadow-2xl lg:shadow-none overflow-hidden ${isSidebarOpen
                        ? 'w-72 translate-x-0 border-r border-[hsl(var(--border))] pointer-events-auto'
                        : 'w-0 -translate-x-full lg:w-0 border-none pointer-events-none'
                    }`}
            >
                <div className="h-24 flex items-center pt-4 px-6 border-b border-[hsl(var(--border))]">
                    <div className="flex-1 h-14 flex items-center gap-3 px-4 border border-[hsl(var(--border))] rounded-2xl bg-[hsl(var(--muted)/0.3)] hover:bg-[hsl(var(--muted)/0.5)] transition-all overflow-hidden">
                        <div className="w-8 h-8 bg-[hsl(var(--primary))] rounded-xl flex items-center justify-center shadow-lg shadow-[hsl(var(--primary)/0.2)] flex-shrink-0">
                            <Calculator className="text-[hsl(var(--primary-foreground))]" size={18} />
                        </div>
                        <div className="overflow-hidden">
                            <h1 className="font-black text-[10px] tracking-widest uppercase leading-none">Pure Terminal</h1>
                            <p className="text-[8px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] opacity-60 mt-1 leading-none truncate">{user?.branch_name || 'Assigned Branch'}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-2 overflow-x-hidden">
                    <SidebarItem id="overview" label="Daily Stats" icon={LayoutDashboard} activeTab={activeTab} onClick={(id) => { setActiveTab(id); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                    <SidebarItem id="billing" label="Bill Matrix" icon={Calculator} activeTab={activeTab} onClick={(id) => { setActiveTab(id); setIsSidebarOpen(false); }} />
                    <SidebarItem id="history" label="Sales Logs" icon={History} activeTab={activeTab} onClick={(id) => { setActiveTab(id); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                </nav>

                <div className="p-8 border-t border-[hsl(var(--border))] overflow-hidden">
                    <div className="flex items-center gap-4 mb-6 whitespace-nowrap">
                        <div className="w-10 h-10 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center overflow-hidden border border-[hsl(var(--border))] flex-shrink-0">
                            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`} alt="avatar" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-black uppercase truncate tracking-tight">{user?.username}</p>
                            <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">Authorized Staff</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            window.location.href = '/';
                        }}
                        className="w-full flex items-center justify-between p-4 bg-[hsl(var(--muted))] rounded-2xl text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)] transition-all whitespace-nowrap"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest">Terminate Session</span>
                        <LogOut size={16} />
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <header className="h-24 pt-4 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] sticky top-0 z-40 px-10 flex items-center justify-between no-print transition-all duration-300">
                    <div className="flex items-center gap-8">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => {
                                    setActiveTab('overview');
                                    setIsSidebarOpen(true);
                                }}
                                className="p-4 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-2xl shadow-xl shadow-[hsl(var(--primary)/0.3)] hover:scale-110 active:scale-95 transition-all animate-in zoom-in group relative cursor-pointer z-[100]"
                            >
                                <Menu size={24} />
                                <span className="absolute left-full ml-4 px-4 py-2 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap rounded-xl shadow-2xl pointer-events-none border border-white/10">
                                    Return to Dashboard
                                </span>
                            </button>
                        )}
                        <div className="px-6 h-14 flex items-center border border-[hsl(var(--border))] rounded-2xl bg-[hsl(var(--muted)/0.3)]">
                            <h2 className="text-xl font-black uppercase tracking-tighter text-[hsl(var(--foreground))]">
                                {activeTab === 'overview' ? 'Dashboard Intelligence' : activeTab === 'billing' ? 'Bill Matrix Terminal' : 'Transaction Logs'}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-6 mr-6 border-r border-[hsl(var(--border))] pr-6">
                            <div className="text-right">
                                <p className="text-[9px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-widest">Session Revenue</p>
                                <p className="text-sm font-black">${salesLedger.reduce((acc, s) => acc + Number(s.subtotal), 0).toLocaleString()}</p>
                            </div>
                        </div>

                        <button onClick={toggleTheme} className="p-3 bg-[hsl(var(--muted))] rounded-2xl text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] transition-all">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </header>

                <div className="p-8 flex-1 pb-40 min-w-0">
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-500 w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {[
                                    { label: 'Today Revenue', value: `$${salesLedger.reduce((acc, s) => acc + Number(s.subtotal), 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500' },
                                    { label: 'Transactions', value: salesLedger.length, icon: History, color: 'text-blue-500' },
                                    { label: 'Avg Purity', value: `${(salesLedger.reduce((acc, s) => acc + Number(s.actual_product_quality), 0) / (salesLedger.length || 1)).toFixed(2)}%`, icon: BarChart3, color: 'text-purple-500' },
                                    { label: 'Spot Gold', value: `$${netPrice.toLocaleString()}`, icon: DollarSign, color: 'text-orange-500' },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-8 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group">
                                        <div className="flex items-center justify-between mb-6">
                                            <p className="text-[10px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-[0.2em]">{stat.label}</p>
                                            <div className={`p-3 rounded-2xl bg-[hsl(var(--muted))] ${stat.color} group-hover:scale-110 transition-all`}>
                                                <stat.icon size={20} />
                                            </div>
                                        </div>
                                        <p className="text-3xl font-black text-[hsl(var(--foreground))] tracking-tighter">{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="erp-section">
                                    <div className="erp-section-header">
                                        <h3 className="erp-section-title">Quick Actions</h3>
                                    </div>
                                    <div className="erp-section-content grid grid-cols-2 gap-4">
                                        <button onClick={() => setActiveTab('billing')} className="flex flex-col items-center justify-center p-8 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-[2rem] gap-4 hover:scale-[1.02] transition-all shadow-xl shadow-[hsl(var(--primary)/0.2)]">
                                            <Calculator size={32} />
                                            <span className="font-black uppercase text-[10px] tracking-[0.2em]">New Bill Matrix</span>
                                        </button>
                                        <button onClick={() => setActiveTab('history')} className="flex flex-col items-center justify-center p-8 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-[2rem] gap-4 hover:scale-[1.02] transition-all border border-[hsl(var(--border))]">
                                            <History size={32} />
                                            <span className="font-black uppercase text-[10px] tracking-[0.2em]">View History</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="erp-section">
                                    <div className="erp-section-header">
                                        <h3 className="erp-section-title">Terminal Info</h3>
                                    </div>
                                    <div className="erp-section-content space-y-4">
                                        <div className="flex justify-between items-center p-4 bg-[hsl(var(--muted))] rounded-2xl">
                                            <span className="text-[10px] font-black uppercase text-[hsl(var(--muted-foreground))]">Market Price ({marketCurrency})</span>
                                            <span className="font-black">${marketPrice || '---'}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-[hsl(var(--muted))] rounded-2xl">
                                            <span className="text-[10px] font-black uppercase text-[hsl(var(--muted-foreground))]">Forex Rate ({changeCurrency})</span>
                                            <span className="font-black">{changeCurrencyRate || '---'} {changeCurrency}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-[hsl(var(--muted))] rounded-2xl border-l-4 border-emerald-500">
                                            <span className="text-[10px] font-black uppercase text-[hsl(var(--muted-foreground))]">X-Factor Efficiency</span>
                                            <span className="font-black">{branchXFactor}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500 w-full">
                            {/* Header Section */}
                            <div className="erp-section">
                                <div className="erp-section-header">
                                    <h3 className="erp-section-title flex items-center gap-2"><ArrowLeftRight size={16} /> System Procurement Header</h3>
                                    <span className="erp-badge">Session Metadata</span>
                                </div>
                                <div className="erp-section-content grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                                    <div className="erp-input-group">
                                        <label className="erp-label">Client/Agency</label>
                                        <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="erp-input text-xl py-5" placeholder="Enter client name..." />
                                    </div>
                                    <div className="erp-input-group">
                                        <label className="erp-label">Filing Date</label>
                                        <input type="date" value={filingDate} onChange={e => setFilingDate(e.target.value)} className="erp-input text-xl py-5" />
                                    </div>
                                    <div className="erp-input-group">
                                        <label className="erp-label">Market Price Currency</label>
                                        <select value={marketCurrency} onChange={e => setMarketCurrency(e.target.value)} className="erp-input text-xl py-5">
                                            <option value="USD">USD</option>
                                            <option value="AED">AED</option>
                                            <option value="EUR">EUR</option>
                                        </select>
                                    </div>
                                    <div className="erp-input-group">
                                        <label className="erp-label">Market Price</label>
                                        <input type="number" value={marketPrice} onChange={e => setMarketPrice(e.target.value as any)} className="erp-input text-xl font-black py-5" placeholder="1800" />
                                    </div>
                                    <div className="erp-input-group">
                                        <label className="erp-label">Discount/Additions</label>
                                        <input type="number" value={discountAdditions} onChange={e => setDiscountAdditions(e.target.value as any)} className="erp-input text-xl font-black py-5" placeholder="0" />
                                    </div>
                                    <div className="erp-input-group">
                                        <label className="erp-label">Net Price</label>
                                        <div className="erp-input bg-[hsl(var(--muted))] text-xl font-black py-5 opacity-90">${netPrice.toFixed(2)}</div>
                                    </div>
                                    <div className="erp-input-group">
                                        <label className="erp-label">Material Unit Input</label>
                                        <select value={materialUnitInput} onChange={e => setMaterialUnitInput(e.target.value)} className="erp-input text-xl py-5">
                                            <option value="Grams">Grams</option>
                                            <option value="Tolas">Tolas</option>
                                        </select>
                                    </div>
                                    <div className="erp-input-group">
                                        <label className="erp-label">Change Currency</label>
                                        <select value={changeCurrency} onChange={e => setChangeCurrency(e.target.value)} className="erp-input text-xl py-5">
                                            <option value="AED">AED</option>
                                            <option value="UGX">UGX</option>
                                            <option value="USD">USD</option>
                                        </select>
                                    </div>
                                    <div className="erp-input-group">
                                        <label className="erp-label">Forex Rate(if needed in bill)</label>
                                        <input type="number" value={changeCurrencyRate} onChange={e => setChangeCurrencyRate(e.target.value as any)} className="erp-input text-xl font-black py-5" placeholder="3850" />
                                    </div>
                                    <div className="erp-input-group">
                                        <label className="erp-label">Transaction Price per Unit</label>
                                        <div className="erp-input bg-[hsl(var(--muted))] text-xl font-black py-5 opacity-90">${tolaRate.toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Product Section */}
                            <div className="erp-section">
                                <div className="erp-section-header">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[hsl(var(--primary))] rounded-xl text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary)/0.2)]">
                                            <Command size={18} />
                                        </div>
                                        <h3 className="erp-section-title">Product Data</h3>
                                    </div>
                                    <button
                                        onClick={addProduct}
                                        className="px-6 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] transition-all shadow-xl shadow-[hsl(var(--primary)/0.1)]"
                                    >
                                        <Calculator size={14} /> + Add Product
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    {computedProducts.map((p, index) => (
                                        <div key={p.id} className="relative p-8 bg-[hsl(var(--muted)/0.3)] rounded-[2.5rem] border border-[hsl(var(--border))] group hover:border-[hsl(var(--primary)/0.2)] transition-all">
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] flex items-center justify-center text-[10px] font-black">
                                                        {index + 1}
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">Product Info</span>
                                                </div>
                                                {products.length > 1 && (
                                                    <button
                                                        onClick={() => removeProduct(p.id)}
                                                        className="p-3 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)] rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 xl:grid-cols-7 gap-6">
                                                {/* Col 1: Identity */}
                                                <div className="space-y-6">
                                                    <div className="erp-input-group">
                                                        <label className="erp-label">Product Name</label>
                                                        <input type="text" value={p.productName} onChange={e => updateProduct(p.id, 'productName', e.target.value)} className="erp-input text-sm font-bold py-4" placeholder="Product Name" />
                                                    </div>
                                                    <div className="erp-input-group">
                                                        <label className="erp-label">Description</label>
                                                        <input type="text" value={p.description} onChange={e => updateProduct(p.id, 'description', e.target.value)} className="erp-input text-sm py-4" placeholder="Detailed description" />
                                                    </div>
                                                </div>

                                                {/* Col 2: Weights 1 */}
                                                <div className="space-y-6">
                                                    <div className="erp-input-group">
                                                        <label className="erp-label">Gross Weight</label>
                                                        <input type="number" value={p.grossWeight} onChange={e => updateProduct(p.id, 'grossWeight', e.target.value as any)} className="erp-input text-lg font-black py-4" placeholder="0" />
                                                    </div>
                                                    <div className="erp-input-group">
                                                        <label className="erp-label">Process Loss</label>
                                                        <div className="erp-input bg-[hsl(var(--muted))] text-lg font-black py-4 opacity-70">{p.processLoss.toFixed(3)}</div>
                                                    </div>
                                                </div>

                                                {/* Col 3: Weights 2 */}
                                                <div className="space-y-6">
                                                    <div className="erp-input-group">
                                                        <label className="erp-label text-[9px]">Actual Process Weight</label>
                                                        <input type="number" value={p.actualProcessWeight} onChange={e => updateProduct(p.id, 'actualProcessWeight', e.target.value as any)} className="erp-input text-lg font-black py-4" placeholder="0" />
                                                    </div>
                                                    <div className="erp-input-group">
                                                        <label className="erp-label text-[9px]">Quantity (Tola)</label>
                                                        <div className="erp-input bg-[hsl(var(--muted))] text-lg font-black py-4 opacity-70">{p.tolaQty.toFixed(4)}</div>
                                                    </div>
                                                </div>

                                                {/* Col 4: Scientific 1 */}
                                                <div className="space-y-6">
                                                    <div className="erp-input-group">
                                                        <label className="erp-label text-[9px]">Second Process Weight</label>
                                                        <input type="number" value={p.secondProcessWeight} onChange={e => updateProduct(p.id, 'secondProcessWeight', e.target.value as any)} className="erp-input text-lg font-black py-4" placeholder="0" />
                                                    </div>
                                                    <div className="erp-input-group">
                                                        <label className="erp-label">UOM</label>
                                                        <select value={p.uom} onChange={e => updateProduct(p.id, 'uom', e.target.value)} className="erp-input text-sm py-4">
                                                            <option value="Tola">Tola</option>
                                                            <option value="Gram">Gram</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Col 5: Scientific 2 */}
                                                <div className="space-y-6">
                                                    <div className="erp-input-group">
                                                        <label className="erp-label text-[9px]">Manual first Process</label>
                                                        <input type="number" value={p.manualFirstProcess} onChange={e => updateProduct(p.id, 'manualFirstProcess', e.target.value as any)} className="erp-input text-lg font-black py-4" placeholder="0" />
                                                    </div>
                                                    <div className="erp-input-group">
                                                        <label className="erp-label">Unit Price</label>
                                                        <div className="erp-input bg-[hsl(var(--muted))] text-lg font-black py-4 opacity-70">${p.unitPrice.toFixed(2)}</div>
                                                    </div>
                                                </div>

                                                {/* Col 6: Purity */}
                                                <div className="space-y-6">
                                                    <div className="erp-input-group">
                                                        <label className="erp-label text-[9px]">Actual Product Quality (%)</label>
                                                        <div className="erp-input bg-[hsl(var(--muted))] text-lg font-black py-4">{p.finalPurity.toFixed(2)}%</div>
                                                    </div>
                                                    <div className="erp-input-group">
                                                        <label className="erp-label">Taxes</label>
                                                        <input type="number" value={p.taxes} onChange={e => updateProduct(p.id, 'taxes', e.target.value as any)} className="erp-input text-lg font-black py-4" placeholder="0" />
                                                    </div>
                                                </div>

                                                {/* Col 7: Final */}
                                                <div className="space-y-6">
                                                    <div className="erp-input-group">
                                                        <label className="erp-label">Manual Purity</label>
                                                        <input type="number" value={p.manualPurity} onChange={e => updateProduct(p.id, 'manualPurity', e.target.value as any)} className="erp-input text-lg font-black py-4" placeholder="0" />
                                                    </div>
                                                    <div className="erp-input-group">
                                                        <label className="erp-label font-bold text-[hsl(var(--primary))]">Subtotal</label>
                                                        <div className="erp-input bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-lg font-black py-4">${p.subtotal.toFixed(2)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500 max-w-[1400px] mx-auto">
                            <div className="erp-section">
                                <div className="erp-section-header">
                                    <h3 className="erp-section-title">Sales Archive</h3>
                                    <span className="erp-badge">{salesLedger.length} Transactions</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[hsl(var(--muted))] text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                                                <th className="p-6">Date</th>
                                                <th className="p-6">Vendor</th>
                                                <th className="p-6">Net Price</th>
                                                <th className="p-6">Subtotal</th>
                                                <th className="p-6">Paid</th>
                                                <th className="p-6">Status</th>
                                                <th className="p-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[hsl(var(--border))]">
                                            {salesLedger.map((sale) => (
                                                <tr key={sale.id} className="hover:bg-[hsl(var(--muted)/0.3)] transition-colors group">
                                                    <td className="p-6 text-xs font-bold text-[hsl(var(--muted-foreground))]">
                                                        {new Date(sale.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-6 text-sm font-black uppercase">{sale.vendor}</td>
                                                    <td className="p-6 text-sm font-bold text-[hsl(var(--foreground))]">${Number(sale.net_price).toFixed(2)}</td>
                                                    <td className="p-6 text-sm font-black text-[hsl(var(--foreground))]">${Number(sale.subtotal).toFixed(2)}</td>
                                                    <td className="p-6 text-sm font-bold text-emerald-600">${Number(sale.paid_amount).toFixed(2)}</td>
                                                    <td className="p-6">
                                                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                            Settled
                                                        </span>
                                                    </td>
                                                    <td className="p-6 text-right">
                                                        <button 
                                                            onClick={() => handleViewSale(sale)}
                                                            className="p-3 bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] rounded-xl transition-all"
                                                            title="View Bill"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sticky Valuation Summary Bar - Remix Style */}
                {activeTab === 'billing' && (
                    <div className={`fixed bottom-0 left-0 right-0 ${isSidebarOpen ? 'lg:left-72' : 'lg:left-0'} bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 no-print transition-all duration-500 ease-in-out`}>
                        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-8">
                            <div className="flex items-center gap-12">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1">Total RM</span>
                                    <span className="text-xl font-black text-[hsl(var(--foreground))]">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1">Total TA (Paid)</span>
                                    <input
                                        type="number"
                                        value={paidAmount}
                                        onChange={e => setPaidAmount(e.target.value as any)}
                                        className="bg-transparent border-none text-xl font-black text-[hsl(var(--foreground))] w-32 p-0 focus:ring-0 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1">Net Payable ({marketCurrency})</span>
                                    <span className="text-3xl font-black text-[hsl(var(--foreground))] leading-none tracking-tighter">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    {changeCurrencyRate !== '' && <p className="text-[10px] font-bold mt-1 text-emerald-600">{totalTargetCurrency.toLocaleString()} {changeCurrency} Equivalent</p>}
                                </div>
                                <button onClick={handlePreview} className="erp-button-primary scale-110">
                                    <CheckCircle2 size={18} /> Preview & Finalize
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Receipt Modal Overlay */}
                {showReceipt && lastSavedSale && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 print:p-0 print:bg-white print:backdrop-blur-none print:static">
                        <div className="bg-white text-zinc-900 w-full max-w-[90rem] h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col print:shadow-none print:border-none print:w-full print:h-auto print:overflow-visible border border-white/20">
                            {/* Modal Actions */}
                            <div className="p-8 bg-zinc-50 border-b flex justify-between items-center print:hidden">
                                <div>
                                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Document Generation Protocol</h3>
                                    <p className="text-sm font-black text-zinc-900">Review & Finalize Transaction</p>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => window.print()}
                                        className="px-10 py-4 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-3"
                                    >
                                        <X size={16} className="rotate-45" /> Print Bill
                                    </button>
                                    <button
                                        onClick={downloadPDF}
                                        className="px-10 py-4 bg-white border-2 border-zinc-900 text-zinc-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all flex items-center gap-3"
                                    >
                                        <FileDown size={16} /> Download PDF
                                    </button>
                                    {!isViewingMode && (
                                        <button
                                            onClick={handleConfirmAndSave}
                                            className="px-10 py-4 bg-[var(--gold-primary)] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] transition-all shadow-xl shadow-amber-500/20 flex items-center gap-3"
                                        >
                                            <CheckCircle2 size={16} /> Confirm Sale
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowReceipt(false)}
                                        className="p-4 text-zinc-400 hover:text-red-500 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Printable Receipt Area */}
                            <div id="receipt-content" className="p-12 print:p-8 font-sans text-zinc-900 bg-white flex-1 overflow-y-auto print:overflow-visible print:h-auto">
                                {lastSavedSale && (
                                    <>
                                        {/* Top Header: Name on left, Date/PO on right */}
                                        <div className="flex justify-between items-start mb-10">
                                            <div>
                                                <h2 className="text-2xl font-bold text-zinc-800">{lastSavedSale.client_name || 'Walking Customer'}</h2>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <div className="flex gap-4 justify-end">
                                                    <span className="font-bold">Date:</span>
                                                    <span>{lastSavedSale.created_at ? new Date(lastSavedSale.created_at).toLocaleDateString('en-GB') : '---'}</span>
                                                </div>
                                                <div className="flex gap-4 justify-end">
                                                    <span className="font-bold">PO#:</span>
                                                    <span className="font-mono">PN{lastSavedSale.id ? lastSavedSale.id.split('-')[0].toUpperCase() : '---'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Summary Stats Row */}
                                        <div className="grid grid-cols-3 gap-8 mb-8 text-[13px]">
                                            <div className="flex gap-4">
                                                <span className="font-bold">Mkt Price:</span>
                                                <span>{Number(lastSavedSale.market_price || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex gap-4 justify-center">
                                                <span className="font-bold">Additions:</span>
                                                <span>{Number(lastSavedSale.discount_additions || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex gap-4 justify-end">
                                                <span className="font-bold">Forex Rate:</span>
                                                <span>{Number(lastSavedSale.change_currency_rate || 0).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* Main Transaction Table */}
                                        <table className="w-full text-[13px] border-collapse mb-6">
                                            <thead>
                                                <tr className="border-b border-zinc-200">
                                                    <th className="py-4 px-2 text-left font-bold">SI #</th>
                                                    <th className="py-4 px-2 text-center font-bold">Qty Grams</th>
                                                    <th className="py-4 px-2 text-center font-bold">Qty Tolas</th>
                                                    <th className="py-4 px-2 text-center font-bold">Tola Rate</th>
                                                    <th className="py-4 px-2 text-center font-bold">Purity %</th>
                                                    <th className="py-4 px-2 text-center font-bold">Unit Price</th>
                                                    <th className="py-4 px-2 text-center font-bold">Price Currency</th>
                                                    <th className="py-4 px-2 text-right font-bold">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-50">
                                                {(lastSavedSale.products || []).map((p: any) => (
                                                    <tr key={p.id}>
                                                        <td className="py-4 px-2">RM</td>
                                                        <td className="py-4 px-2 text-center">{Number(p.actualProcessWeight || 0).toFixed(2)}</td>
                                                        <td className="py-4 px-2 text-center">{Number(p.tolaQty || 0).toFixed(2)}</td>
                                                        <td className="py-4 px-2 text-center">{Number(lastSavedSale.tola_rate || 0).toFixed(2)}</td>
                                                        <td className="py-4 px-2 text-center">{Number(p.finalPurity || 0).toFixed(2)}</td>
                                                        <td className="py-4 px-2 text-center">{Number(p.unitPrice || 0).toFixed(2)}</td>
                                                        <td className="py-4 px-2 text-center">{lastSavedSale.market_currency}</td>
                                                        <td className="py-4 px-2 text-right">{Number(p.subtotal || 0).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-y-2 border-zinc-900 font-bold">
                                                    <td className="py-3 px-2">Total</td>
                                                    <td className="py-3 px-2 text-center">{(lastSavedSale.products || []).reduce((acc: number, p: any) => acc + Number(p.actualProcessWeight || 0), 0).toFixed(2)}</td>
                                                    <td className="py-3 px-2 text-center">{(lastSavedSale.products || []).reduce((acc: number, p: any) => acc + Number(p.tolaQty || 0), 0).toFixed(2)}</td>
                                                    <td colSpan={4}></td>
                                                    <td className="py-3 px-2 text-right">
                                                        <div className="flex justify-end gap-4">
                                                            <span>{lastSavedSale.market_currency} $:</span>
                                                            <span>{Number(lastSavedSale.subtotal || 0).toFixed(2)}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>

                                        {/* Payment Summary */}
                                        <div className="flex justify-end mb-12">
                                            <div className="w-1/3 border-b-2 border-zinc-900 pb-2 space-y-1">
                                                <div className="flex justify-between items-center text-[13px]">
                                                    <span className="font-bold">Payment:</span>
                                                    <div className="flex gap-4">
                                                        <span>{lastSavedSale.market_currency} $:</span>
                                                        <span className="font-bold">{Number(lastSavedSale.subtotal || 0).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                                {Number(lastSavedSale.change_currency_rate || 0) > 0 && (
                                                    <div className="flex justify-between items-center text-[13px]">
                                                        <span className="font-bold opacity-0">Payment:</span>
                                                        <div className="flex gap-4">
                                                            <span>{lastSavedSale.change_currency}:</span>
                                                            <span className="font-bold">
                                                                {Math.round(Number(lastSavedSale.total_target_currency || 0) / 1000) * 1000 ? (Math.round(Number(lastSavedSale.total_target_currency || 0) / 1000) * 1000).toLocaleString() : Number(lastSavedSale.total_target_currency || 0).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                    </>
                                )}

                                <div className="mt-32 text-[10px] text-center text-zinc-300 uppercase tracking-[0.4em]">
                                    Official Digital Protocol • Gold ERP System
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default POS;

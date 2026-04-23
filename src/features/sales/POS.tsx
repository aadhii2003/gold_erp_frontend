import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { calculateDensity, calculatePurity } from '../../utils/calculations';
import { saveSaleOffline } from '../../db/indexedDB';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const POS = () => {
    const { token, user } = useSelector((state: RootState) => state.auth);
    const branchXFactor = (user as any)?.x_factor || 92.0;

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

    return (
        <div className="max-w-[1700px] mx-auto space-y-10 pb-24 p-6 font-mono selection:bg-white selection:text-black">
            {/* Header Info */}
            <div className="flex justify-between items-center bg-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-2xl">
                <div>
                    <h2 className="text-4xl font-black text-white italic tracking-tighter">POS TERMINAL</h2>
                    <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest font-black">Node: {user?.username} • X-FACTOR: {branchXFactor}</p>
                </div>
                <div className="flex gap-8">
                     <div className="text-right">
                        <span className="text-[10px] text-zinc-600 block uppercase font-black">Subtotal (USD)</span>
                        <span className="text-white text-4xl font-black">${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                     </div>
                     <div className="text-right bg-white text-black px-6 py-2 rounded-xl">
                        <span className="text-[10px] text-zinc-500 block uppercase font-black">Ugx Conversion</span>
                        <span className="text-2xl font-black">{totalUgx.toLocaleString()} /=</span>
                     </div>
                </div>
            </div>

            {/* RFQ Container - LARGER FIELDS */}
            <div className="card bg-zinc-950 border-zinc-800 p-8 space-y-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
                <h3 className="text-white font-black uppercase tracking-tighter border-b border-zinc-800 pb-4 text-xl">1. REQUEST FOR QUOTATION (RFQ)</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-6">
                    <div className="space-y-3">
                        <label className="text-zinc-500 font-black uppercase text-xs">Vendor Identity</label>
                        <input type="text" value={vendor} onChange={e => setVendor(e.target.value)} className="input-field py-4 bg-black text-lg h-14 border-zinc-700 focus:border-white transition-all" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-zinc-500 font-black uppercase text-xs">Purchase Method</label>
                        <input type="text" value={purchaseMethod} onChange={e => setPurchaseMethod(e.target.value)} className="input-field py-4 bg-black text-lg h-14 border-zinc-700" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-zinc-500 font-black uppercase text-xs">Currency</label>
                        <select value={marketPriceCurrency} onChange={e => setMarketPriceCurrency(e.target.value)} className="input-field py-4 bg-black text-lg h-14 border-zinc-700">
                            {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                        </select>
                    </div>
                    <div className="space-y-3 lg:col-span-1">
                        <label className="text-blue-500 font-black uppercase text-xs">Market Price</label>
                        <input type="number" value={marketPrice} onChange={e => setMarketPrice(Number(e.target.value))} className="input-field py-4 bg-black text-2xl h-14 border-blue-900 focus:border-blue-500 text-white font-black" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-zinc-500 font-black uppercase text-xs">Adjustment (+/-)</label>
                        <input type="number" value={rfqDiscount} onChange={e => setRfqDiscount(Number(e.target.value))} className="input-field py-4 bg-black text-lg h-14 border-zinc-700" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-zinc-600 font-black uppercase text-xs">Net Price (Auto)</label>
                        <div className="input-field py-4 bg-zinc-900 border-zinc-800 text-white font-black text-2xl h-14 flex items-center px-4">{netPrice.toFixed(2)}</div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-zinc-500 font-black uppercase text-xs">UOM</label>
                        <select value={marketPriceUnit} onChange={e => setMarketPriceUnit(e.target.value)} className="input-field py-4 bg-black text-lg h-14 border-zinc-700 uppercase">
                            {uoms.map(u => <option key={u.code} value={u.code}>{u.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Constants Bar - LARGER FIELDS */}
            <div className="bg-zinc-900/40 border-2 border-zinc-800 p-6 rounded-3xl grid grid-cols-2 lg:grid-cols-5 xl:grid-cols-11 gap-6 items-end shadow-2xl">
                <div className="space-y-2"><label className="label-small text-zinc-500">Deadline</label><input type="date" value={orderDeadline} onChange={e => setOrderDeadline(e.target.value)} className="bg-transparent border-b-2 border-zinc-700 text-white w-full outline-none text-sm py-2" /></div>
                <div className="space-y-2"><label className="label-small text-zinc-500">Arrival</label><input type="date" value={expectedArrival} onChange={e => setExpectedArrival(e.target.value)} className="bg-transparent border-b-2 border-zinc-700 text-white w-full outline-none text-sm py-2" /></div>
                <div className="space-y-2">
                    <label className="label-small text-zinc-500">Trans Currency</label>
                    <select value={transactionCurrency} onChange={e => setTransactionCurrency(e.target.value)} className="bg-transparent border-b-2 border-zinc-700 text-white w-full outline-none text-sm py-2">
                        {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                </div>
                <div className="space-y-2"><label className="label-small text-white">Rate</label><input type="number" value={currencyRate} onChange={e => setCurrencyRate(Number(e.target.value))} className="bg-transparent border-b-2 border-zinc-700 text-white w-full outline-none text-xl font-black py-1" /></div>
                <div className="space-y-2"><label className="label-small text-zinc-500">Unit</label><div className="text-zinc-400 border-b-2 border-zinc-800 uppercase text-lg font-bold py-1">{transactionUnit}</div></div>
                <div className="space-y-2"><label className="label-small text-zinc-500">Conv Factor</label><input type="number" value={conversionMarketUnit} onChange={e => setConversionMarketUnit(Number(e.target.value))} className="bg-transparent border-b-2 border-zinc-700 text-white w-full outline-none text-lg py-1" /></div>
                <div className="space-y-2 col-span-1"><label className="label-small text-blue-500">Unit Price</label><div className="text-blue-400 font-black text-xl border-b-2 border-blue-900/30 py-1">${unitPrice.toFixed(2)}</div></div>
                <div className="space-y-2"><label className="label-small text-zinc-600 font-black uppercase">Xfactor</label><div className="text-zinc-600 font-bold border-b-2 border-zinc-800 text-lg py-1">{branchXFactor}</div></div>
                <div className="space-y-2 lg:col-span-1">
                    <label className="label-small text-zinc-500">Payment Ref</label>
                    <select value={paymentRef} onChange={e => setPaymentRef(e.target.value)} className="bg-transparent border-b-2 border-zinc-700 text-white w-full outline-none text-xs py-2">
                        <option value="Paid Unfixed Amount">Paid Unfixed Amount</option>
                        <option value="Fixed">Fixed</option>
                    </select>
                </div>
                <div className="space-y-2"><label className="label-small text-white uppercase">Paid Amt</label><input type="number" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} className="bg-transparent border-b-2 border-zinc-700 text-white w-full outline-none text-xl font-black py-1" /></div>
                <div className="space-y-2"><label className="label-small text-red-500">Balance</label><div className="text-red-500 font-black text-xl border-b-2 border-red-900/30 py-1">${balance.toFixed(2)}</div></div>
            </div>

            {/* Material Input Sequence - VERY LARGE FIELDS */}
            <div className="card bg-zinc-950 border-white/5 shadow-2xl p-0 overflow-hidden mt-10">
                <div className="bg-white/5 px-8 py-4 text-xs uppercase font-black tracking-[0.3em] text-zinc-500 border-b border-white/5 shadow-inner">2. MATERIAL QUALITY & TRANSACTION SEQUENCE</div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-11 gap-8 items-center bg-zinc-900/20">
                    <div className="space-y-3 lg:col-span-1"><label className="label-small text-zinc-500 uppercase">Product</label><input type="text" value={productName} onChange={e => setProductName(e.target.value)} className="input-field py-4 bg-black text-lg h-14 border-zinc-800" /></div>
                    <div className="space-y-3 lg:col-span-1"><label className="label-small text-zinc-500 uppercase">Decs</label><input type="text" value={description} onChange={e => setDescription(e.target.value)} className="input-field py-4 bg-black text-lg h-14 border-zinc-800" /></div>
                    <div className="space-y-3"><label className="label-small text-zinc-500 uppercase">Gross (g)</label><input type="number" value={grossWeight} onChange={e => setGrossWeight(Number(e.target.value))} className="input-field py-4 bg-black text-xl h-14 border-zinc-800 font-mono" /></div>
                    <div className="space-y-3"><label className="label-small text-white uppercase font-black">Actual (g)</label><input type="number" value={actualProcessWeight} onChange={e => setActualProcessWeight(Number(e.target.value))} className="input-field py-4 bg-zinc-950 border-white/20 text-2xl font-black h-14 shadow-[0_0_15px_rgba(255,255,255,0.05)]" /></div>
                    <div className="space-y-3"><label className="label-small text-white uppercase font-black">Second (g)</label><input type="number" value={secondProcessWeight} onChange={e => setSecondProcessWeight(Number(e.target.value))} className="input-field py-4 bg-zinc-950 border-white/20 text-2xl font-black h-14 shadow-[0_0_15px_rgba(255,255,255,0.05)]" /></div>
                    <div className="space-y-3"><label className="label-small text-zinc-600 uppercase">Loss</label><div className="text-zinc-500 font-mono text-xl font-bold">{processLoss.toFixed(3)}</div></div>
                    <div className="space-y-3"><label className="label-small text-zinc-600 uppercase">Density</label><div className="text-zinc-500 font-mono text-xl font-bold">{density.toFixed(3)}</div></div>
                    <div className="space-y-3"><label className="label-small text-blue-500 uppercase font-black">Purity (%)</label><div className="text-blue-400 font-black text-3xl">{computedPurity.toFixed(2)}%</div></div>
                    <div className="space-y-3"><label className="label-small text-zinc-500 uppercase">USD Net</label><div className="text-white font-black text-2xl">${subtotal.toLocaleString(undefined, {maximumFractionDigits: 0})}</div></div>
                    <div className="space-y-3"><label className="label-small text-green-600 uppercase font-black">UGX TOTAL</label><div className="text-green-500 font-black text-lg whitespace-nowrap">{totalUgx.toLocaleString()}</div></div>
                    <div className="pt-6">
                        <button onClick={handleSave} className="w-full bg-white text-black hover:bg-zinc-200 font-black py-4 rounded-2xl text-xs uppercase tracking-[0.4em] transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                            POST_BILL
                        </button>
                    </div>
                </div>
            </div>

            {/* Audit History */}
            <div className="mt-12 overflow-x-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-zinc-800 rounded-3xl overflow-hidden bg-black/40">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-500 uppercase text-[10px] tracking-widest">
                            <th className="p-6">Execution Timestamp</th><th className="p-6">Vendor Origin</th><th className="p-6">Product Details</th><th className="p-6">Analysis Result</th><th className="p-6 text-right">Settlement (USD)</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {salesLedger.map(sale => (
                            <tr key={sale.id} className="border-b border-zinc-900 hover:bg-zinc-900/50 transition-all group">
                                <td className="p-6 text-zinc-500 font-mono text-xs">{new Date(sale.created_at).toLocaleString()}</td>
                                <td className="p-6"><div className="text-white font-black uppercase text-base">{sale.vendor || 'UNKNOWN'}</div><div className="text-[10px] text-zinc-600 italic uppercase tracking-wider">{sale.purchase_method}</div></td>
                                <td className="p-6 text-zinc-400 font-medium">{sale.product_name} • {sale.actual_process_weight}g / ${sale.market_price} UNIT</td>
                                <td className="p-6"><div className="text-blue-500 font-black text-lg">{Number(sale.actual_product_quality).toFixed(2)}% PURITY</div><div className="text-[10px] text-zinc-700 italic font-black uppercase">BRANCH_FACTOR: {sale.x_factor}</div></td>
                                <td className="p-6 text-right"><div className="text-white font-black text-xl">${Number(sale.subtotal).toLocaleString(undefined, {minimumFractionDigits: 2})}</div><div className="text-green-900 text-[10px] font-black">{Number(sale.total_ugx).toLocaleString()} /=</div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default POS;

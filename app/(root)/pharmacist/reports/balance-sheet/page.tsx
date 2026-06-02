"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, animate, AnimatePresence } from "framer-motion";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2, Check, AlertTriangle, Settings2, ChevronDown, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loading from "@/components/shared/Loading";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FixedAssetLine {
  id: string; name: string; initialCost: number;
  depreciationRate: number; purchaseDate: string;
  depreciation: number; netValue: number;
}
interface AccruedExpenseLine { id: string; label: string; amount: number; month: number; year: number; }
interface VendorLine { id: string; name: string; balance: number; vendorType: string; }
interface BalanceSheetData {
  asOf: string;
  assets: {
    current: { cashInHand: number; cashAtBank: number; goodStock: number; expiredStock: number; netInventory: number; accountsReceivable: number; total: number; };
    fixed: { items: FixedAssetLine[]; total: number; };
    total: number;
  };
  liabilities: { accountsPayable: VendorLine[]; accruedExpenses: AccruedExpenseLine[]; totalAccountsPayable: number; totalAccruedExpenses: number; total: number; };
  equity: { capital: number; netProfit: number; total: number; };
  totalLiabilitiesAndEquity: number;
  balanced: boolean;
}
interface BSConfig { cashInHand: number; cashAtBank: number; capitalAmount: number; }

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);

const TODAY = new Date();
const DEFAULT_FROM = `${TODAY.getFullYear()}-01-01`;
const DEFAULT_TO   = TODAY.toISOString().slice(0, 10);

function CountUp({ to, delay = 0 }: { to: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const ctrl = animate(0, to, {
      duration: 1.2, delay, ease: [0.16, 1, 0.3, 1],
      onUpdate(v) { node.textContent = fmt(v); },
    });
    return ctrl.stop;
  }, [to, delay]);
  return <span ref={ref}>{fmt(0)}</span>;
}

// ── Table row helpers ─────────────────────────────────────────────────────────

function SectionHeadRow({ label }: { label: string }) {
  return (
    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
      <TableCell colSpan={2} className="py-2 px-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
      </TableCell>
    </TableRow>
  );
}

function SubHeadRow({ label }: { label: string }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={2} className="py-1.5 pl-8 pr-4">
        <span className="text-[11px] font-semibold text-gray-400 italic">{label}</span>
      </TableCell>
    </TableRow>
  );
}

function ItemRow({
  label, amount, indent = 1, negative = false, subtext,
}: {
  label: string; amount: number; indent?: number; negative?: boolean; subtext?: string;
}) {
  const pl = indent === 1 ? "pl-6" : indent === 2 ? "pl-10" : "pl-4";
  return (
    <TableRow className="hover:bg-gray-50/50 transition-colors">
      <TableCell className={`${pl} py-2.5`}>
        <span className="text-sm text-gray-700">{label}</span>
        {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
      </TableCell>
      <TableCell className={`text-right text-sm font-mono tabular-nums whitespace-nowrap py-2.5 ${negative ? "text-rose-600" : "text-gray-800"}`}>
        {negative ? `(${fmt(Math.abs(amount))})` : fmt(amount)}
      </TableCell>
    </TableRow>
  );
}

function SubtotalRow({ label, amount, accent = "text-gray-900" }: { label: string; amount: number; accent?: string }) {
  return (
    <TableRow className="bg-gray-50/60 hover:bg-gray-50/60 border-t border-gray-100">
      <TableCell className="pl-6 py-2.5">
        <span className={`text-sm font-semibold ${accent}`}>{label}</span>
      </TableCell>
      <TableCell className={`text-right text-sm font-bold font-mono tabular-nums whitespace-nowrap py-2.5 ${accent}`}>
        {fmt(amount)}
      </TableCell>
    </TableRow>
  );
}

function GrandTotalRow({ label, amount, colorClass }: { label: string; amount: number; colorClass: string }) {
  return (
    <TableRow className={`${colorClass} hover:opacity-95 border-t-2 border-gray-200`}>
      <TableCell className="pl-4 py-3.5">
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      </TableCell>
      <TableCell className="text-right py-3.5 pr-4">
        <span className="text-base font-bold font-mono tabular-nums whitespace-nowrap">
          <CountUp to={amount} />
        </span>
      </TableCell>
    </TableRow>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BalanceSheetPage() {
  const { user } = useAuth();
  const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [data, setData]             = useState<BalanceSheetData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [from, setFrom]             = useState(DEFAULT_FROM);
  const [to, setTo]                 = useState(DEFAULT_TO);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig]         = useState<BSConfig>({ cashInHand: 0, cashAtBank: 0, capitalAmount: 0 });
  const [editConfig, setEditConfig] = useState<BSConfig>({ cashInHand: 0, cashAtBank: 0, capitalAmount: 0 });
  const [savingConfig, setSavingConfig]       = useState(false);
  const [configHistory, setConfigHistory]     = useState<{ id: string; field: string; previousValue: number; newValue: number; changedAt: string }[]>([]);
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editingHistoryRow, setEditingHistoryRow] = useState({ newValue: "", previousValue: "", changedAt: "" });
  const [addingHistoryEntry, setAddingHistoryEntry] = useState(false);
  const [showHistory, setShowHistory]               = useState(false);
  const [newHistoryEntry, setNewHistoryEntry] = useState({ field: "cashInHand", previousValue: "", newValue: "", changedAt: TODAY.toISOString().slice(0, 10) });
  const [fixedAssets, setFixedAssets]         = useState<FixedAssetLine[]>([]);
  const [newAsset, setNewAsset]               = useState({ name: "", initialCost: "", depreciationRate: "10", purchaseDate: DEFAULT_FROM });
  const [addingAsset, setAddingAsset]         = useState(false);
  const [savingAsset, setSavingAsset]         = useState(false);
  const [accruedExpenses, setAccruedExpenses] = useState<AccruedExpenseLine[]>([]);
  const [newExpense, setNewExpense]           = useState({ label: "", amount: "" });
  const [addingExpense, setAddingExpense]     = useState(false);
  const [savingExpense, setSavingExpense]     = useState(false);

  const hdrs = useCallback(() => ({ Authorization: `Bearer ${user?.access_token}` }), [user?.access_token]);

  const fetchBS = useCallback(async () => {
    if (!user?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/pharmacist/reports/balance-sheet?from=${from}&to=${to}`, { headers: hdrs() });
      setData(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [BASE, from, to, user?.access_token, hdrs]);

  const fetchHistory = useCallback(async () => {
    if (!user?.access_token) return;
    try {
      const res = await fetch(`${BASE}/pharmacist/balance-sheet/config/history`, { headers: hdrs() });
      setConfigHistory(await res.json());
    } catch (e) { console.error(e); }
  }, [BASE, user?.access_token, hdrs]);

  const fetchConfig = useCallback(async () => {
    if (!user?.access_token) return;
    try {
      const [cfgRes, histRes] = await Promise.all([
        fetch(`${BASE}/pharmacist/balance-sheet/config`, { headers: hdrs() }),
        fetch(`${BASE}/pharmacist/balance-sheet/config/history`, { headers: hdrs() }),
      ]);
      const cfg = await cfgRes.json();
      const stripped = { cashInHand: cfg.cashInHand ?? 0, cashAtBank: cfg.cashAtBank ?? 0, capitalAmount: cfg.capitalAmount ?? 0 };
      setConfig(stripped);
      setEditConfig(stripped);
      setConfigHistory(await histRes.json());
    } catch (e) { console.error(e); }
  }, [BASE, user?.access_token, hdrs]);

  const fetchFixedAssets = useCallback(async () => {
    if (!user?.access_token) return;
    try {
      const res = await fetch(`${BASE}/pharmacist/balance-sheet/fixed-assets`, { headers: hdrs() });
      setFixedAssets(await res.json());
    } catch (e) { console.error(e); }
  }, [BASE, user?.access_token, hdrs]);

  const fetchAccruedExpenses = useCallback(async () => {
    if (!user?.access_token) return;
    const now = new Date();
    try {
      const res = await fetch(`${BASE}/pharmacist/balance-sheet/accrued-expenses?month=${now.getMonth()+1}&year=${now.getFullYear()}`, { headers: hdrs() });
      setAccruedExpenses(await res.json());
    } catch (e) { console.error(e); }
  }, [BASE, user?.access_token, hdrs]);

  useEffect(() => { fetchBS(); }, [fetchBS]);
  useEffect(() => {
    if (showConfig) {
      fetchConfig();
      fetchFixedAssets();
      fetchAccruedExpenses();
    }
  }, [showConfig, fetchConfig, fetchFixedAssets, fetchAccruedExpenses]);

  async function saveConfig() {
    setSavingConfig(true);
    try {
      await fetch(`${BASE}/pharmacist/balance-sheet/config`, {
        method: "PATCH",
        headers: { ...hdrs(), "Content-Type": "application/json" },
        body: JSON.stringify({ cashInHand: editConfig.cashInHand, cashAtBank: editConfig.cashAtBank, capitalAmount: editConfig.capitalAmount }),
      });
      // Update both config (display boxes) and editConfig (form) to new values
      setConfig({ ...editConfig });
      setEditConfig({ ...editConfig });
      setShowHistory(true);
      // Inline fetch — avoids stale-closure issues with the fetchBS callback
      setLoading(true);
      try {
        const res = await fetch(
          `${BASE}/pharmacist/reports/balance-sheet?from=${from}&to=${to}`,
          { headers: hdrs() }
        );
        setData(await res.json());
      } finally {
        setLoading(false);
      }
      await fetchHistory();
    } finally {
      setSavingConfig(false);
    }
  }

  async function saveHistoryEdit() {
    if (!editingHistoryId) return;
    await fetch(`${BASE}/pharmacist/balance-sheet/config/history/${editingHistoryId}`, {
      method: "PATCH",
      headers: { ...hdrs(), "Content-Type": "application/json" },
      body: JSON.stringify({
        newValue: parseFloat(editingHistoryRow.newValue) || 0,
        previousValue: parseFloat(editingHistoryRow.previousValue) || 0,
        changedAt: editingHistoryRow.changedAt,
      }),
    });
    setEditingHistoryId(null);
    await fetchHistory();
  }

  async function saveNewHistoryEntry() {
    if (!newHistoryEntry.newValue) return;
    const nv = parseFloat(newHistoryEntry.newValue) || 0;
    const field = newHistoryEntry.field as keyof BSConfig;

    // Save history entry
    await fetch(`${BASE}/pharmacist/balance-sheet/config/history`, {
      method: "POST",
      headers: { ...hdrs(), "Content-Type": "application/json" },
      body: JSON.stringify({
        field: newHistoryEntry.field,
        previousValue: parseFloat(newHistoryEntry.previousValue) || 0,
        newValue: nv,
        changedAt: newHistoryEntry.changedAt,
      }),
    });

    // Also update the live config so balance sheet reflects the new value
    const updatedConfig = { ...editConfig, [field]: nv };
    await fetch(`${BASE}/pharmacist/balance-sheet/config`, {
      method: "PATCH",
      headers: { ...hdrs(), "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: nv }),
    });
    setConfig(updatedConfig);
    setEditConfig(updatedConfig);

    setNewHistoryEntry({ field: "cashInHand", previousValue: "", newValue: "", changedAt: TODAY.toISOString().slice(0, 10) });
    setAddingHistoryEntry(false);
    await fetchHistory();
    setLoading(true);
    try {
      const res = await fetch(
        `${BASE}/pharmacist/reports/balance-sheet?from=${from}&to=${to}`,
        { headers: hdrs() }
      );
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function deleteHistoryEntry(id: string) {
    await fetch(`${BASE}/pharmacist/balance-sheet/config/history/${id}`, { method: "DELETE", headers: hdrs() });
    await fetchHistory();
  }
  async function saveFixedAsset() {
    if (!newAsset.name || !newAsset.initialCost) return;
    setSavingAsset(true);
    try {
      await fetch(`${BASE}/pharmacist/balance-sheet/fixed-assets`, { method: "POST", headers: { ...hdrs(), "Content-Type": "application/json" }, body: JSON.stringify({ name: newAsset.name, initialCost: parseFloat(newAsset.initialCost), depreciationRate: parseFloat(newAsset.depreciationRate) || 10, purchaseDate: newAsset.purchaseDate }) });
      setNewAsset({ name: "", initialCost: "", depreciationRate: "10", purchaseDate: DEFAULT_FROM }); setAddingAsset(false);
      await fetchFixedAssets(); await fetchBS();
    } finally { setSavingAsset(false); }
  }
  async function deleteFixedAsset(id: string) {
    await fetch(`${BASE}/pharmacist/balance-sheet/fixed-assets/${id}`, { method: "DELETE", headers: hdrs() });
    await fetchFixedAssets(); await fetchBS();
  }
  async function saveAccruedExpense() {
    if (!newExpense.label || !newExpense.amount) return;
    const now = new Date(); setSavingExpense(true);
    try {
      await fetch(`${BASE}/pharmacist/balance-sheet/accrued-expenses`, { method: "POST", headers: { ...hdrs(), "Content-Type": "application/json" }, body: JSON.stringify({ label: newExpense.label, amount: parseFloat(newExpense.amount), month: now.getMonth() + 1, year: now.getFullYear() }) });
      setNewExpense({ label: "", amount: "" }); setAddingExpense(false);
      await fetchAccruedExpenses(); await fetchBS();
    } finally { setSavingExpense(false); }
  }
  async function deleteAccruedExpense(id: string) {
    await fetch(`${BASE}/pharmacist/balance-sheet/accrued-expenses/${id}`, { method: "DELETE", headers: hdrs() });
    await fetchAccruedExpenses(); await fetchBS();
  }

  return (
    <>
    <style>{`
      input[type=number]::-webkit-outer-spin-button,
      input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      input[type=number] { -moz-appearance: textfield; }
    `}</style>
    <div className="min-h-screen bg-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* ── HEADER ── */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-red-50 hover:text-red-800">
              <Link href="/pharmacist/reports"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <motion.h1
                className="text-2xl sm:text-3xl font-bold text-red-800 tracking-tight"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              >
                Balance Sheet
              </motion.h1>
              <motion.p className="mt-1 text-sm text-gray-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                Financial position statement — Assets = Liabilities + Equity
              </motion.p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
        </header>

        {/* ── DATE + REFRESH ── */}
        <Card className="mb-6 overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm font-semibold text-red-800">Net Profit Period</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-8 text-sm w-36" />
              <span className="text-gray-400 text-sm">to</span>
              <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-8 text-sm w-36" />
              <Button size="sm" onClick={fetchBS} className="bg-red-800 hover:bg-red-700 text-white h-8 gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card className="bg-white border border-gray-100 rounded-xl shadow-sm">
            <CardContent className="py-24 flex items-center justify-center"><Loading /></CardContent>
          </Card>
        ) : data ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">

            {/* ── SUMMARY CARDS ── */}
            <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white py-4">
                <CardTitle className="text-lg text-slate-800">Financial Position Summary</CardTitle>
                <p className="text-xs text-gray-500 font-normal mt-1">
                  Net profit period: {from} → {to}. Configure manual entries (cash, capital, fixed assets) below.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                  <div className="p-5">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Total Assets</p>
                    <p className="text-xl font-semibold text-slate-900 mt-1">
                      <CountUp to={data.assets.total} />
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Current + Fixed</p>
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Total Liabilities</p>
                    <p className="text-xl font-semibold text-rose-700 mt-1">
                      <CountUp to={data.liabilities.total} delay={0.05} />
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Payables + Accrued</p>
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Owner&rsquo;s Equity</p>
                    <p className="text-xl font-semibold text-green-800 mt-1">
                      <CountUp to={data.equity.total} delay={0.1} />
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Capital + Net Profit</p>
                  </div>
                  <div className={`p-5 ${data.balanced ? "bg-green-50/40" : "bg-rose-50/40"}`}>
                    <p className={`text-[11px] font-bold uppercase tracking-wide ${data.balanced ? "text-green-700" : "text-rose-700"}`}>
                      Balance Check
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {data.balanced
                        ? <><Check className="h-5 w-5 text-green-600" /><span className="text-xl font-bold text-green-800">Balanced</span></>
                        : <><AlertTriangle className="h-5 w-5 text-rose-600" /><span className="text-xl font-bold text-rose-800">Off</span></>
                      }
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Assets = Liabilities + Equity</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── TWO TABLE COLUMNS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* LEFT — ASSETS TABLE */}
              <Card className="overflow-hidden border border-gray-100 rounded-xl shadow-sm bg-white">
                <div className="border-l-4 border-l-blue-500 bg-blue-50/20 px-5 py-4">
                  <h2 className="text-base font-semibold text-blue-900">1. Assets</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Store ke asasay — everything the business owns</p>
                </div>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50/80">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-900 w-[75%]">Description</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-right whitespace-nowrap">Amount (PKR)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>

                      <SectionHeadRow label="Current Assets (Tezi se cash banne wale)" />
                      <ItemRow label="Cash in Hand (Counter par majood cash)" amount={data.assets.current.cashInHand} />
                      <ItemRow label="Cash at Bank (Business bank account)" amount={data.assets.current.cashAtBank} />

                      <SubHeadRow label="Medicine Inventory (Stock)" />
                      <ItemRow label="Good Stock (Fresh Dawaiyan)" amount={data.assets.current.goodStock} indent={2} />
                      <ItemRow label="Less: Expired / Damaged Stock" amount={data.assets.current.expiredStock} indent={2} negative />
                      <ItemRow label="Net Inventory" amount={data.assets.current.netInventory} indent={2} />

                      <ItemRow label="Accounts Receivable — Hospitals / Doctors (Udhar)" amount={data.assets.current.accountsReceivable} />
                      <SubtotalRow label="Total Current Assets" amount={data.assets.current.total} accent="text-blue-800" />

                      <SectionHeadRow label="Fixed Assets (Mustaqil Asasay)" />
                      {data.assets.fixed.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="pl-6 py-3 text-sm text-gray-400 italic">
                            No fixed assets configured — add them below.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.assets.fixed.items.map(a => (
                          <React.Fragment key={a.id}>
                            <SubHeadRow label={a.name} />
                            <ItemRow label="Initial Cost (Shuruati Qeemat)" amount={a.initialCost} indent={2} />
                            <ItemRow label={`Less: Depreciation (Ghisawat ${a.depreciationRate}% accumulated)`} amount={a.depreciation} indent={2} negative />
                            <ItemRow label="Net Book Value" amount={a.netValue} indent={2} />
                          </React.Fragment>
                        ))
                      )}
                      <SubtotalRow label="Total Fixed Assets" amount={data.assets.fixed.total} accent="text-purple-800" />

                      <GrandTotalRow label="TOTAL ASSETS" amount={data.assets.total} colorClass="bg-blue-800 text-white" />
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* RIGHT — LIABILITIES + EQUITY TABLE */}
              <div className="flex flex-col gap-5">

                {/* Liabilities */}
                <Card className="overflow-hidden border border-gray-100 rounded-xl shadow-sm bg-white">
                  <div className="border-l-4 border-l-rose-500 bg-rose-50/20 px-5 py-4">
                    <h2 className="text-base font-semibold text-rose-900">2. Liabilities</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Wajibat — jo paisa dena baqi hai</p>
                  </div>
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50/80">
                        <TableRow>
                          <TableHead className="font-semibold text-gray-900 w-[75%]">Description</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-right whitespace-nowrap">Amount (PKR)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>

                        <SectionHeadRow label="Accounts Payable (Jo Paisa Dena Baqi Hai)" />
                        {data.liabilities.accountsPayable.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} className="pl-6 py-3 text-sm text-gray-400 italic">No outstanding payables.</TableCell>
                          </TableRow>
                        ) : (
                          data.liabilities.accountsPayable.map(v => (
                            <ItemRow key={v.id} label={v.name} amount={v.balance} subtext={v.vendorType} />
                          ))
                        )}
                        <SubtotalRow label="Total Accounts Payable" amount={data.liabilities.totalAccountsPayable} accent="text-rose-700" />

                        <SectionHeadRow label="Accrued Expenses (Baqaaya Jaat)" />
                        {data.liabilities.accruedExpenses.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} className="pl-6 py-3 text-sm text-gray-400 italic">No accrued expenses this month.</TableCell>
                          </TableRow>
                        ) : (
                          data.liabilities.accruedExpenses.map(e => (
                            <ItemRow key={e.id} label={e.label} amount={e.amount} />
                          ))
                        )}
                        <SubtotalRow label="Total Accrued Expenses" amount={data.liabilities.totalAccruedExpenses} accent="text-orange-700" />

                        <GrandTotalRow label="TOTAL LIABILITIES" amount={data.liabilities.total} colorClass="bg-rose-700 text-white" />
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Equity */}
                <Card className="overflow-hidden border border-gray-100 rounded-xl shadow-sm bg-white">
                  <div className="border-l-4 border-l-green-500 bg-green-50/20 px-5 py-4">
                    <h2 className="text-base font-semibold text-green-900">3. Owner&rsquo;s Equity</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Aap ka apna sarmaya</p>
                  </div>
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50/80">
                        <TableRow>
                          <TableHead className="font-semibold text-gray-900 w-[75%]">Description</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-right whitespace-nowrap">Amount (PKR)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>

                        <SectionHeadRow label="Equity Components" />
                        <ItemRow label="Capital — Jo paisa shuru mein lagaya tha" amount={data.equity.capital} />
                        <ItemRow
                          label={`Net Profit / Retained Earnings (${from} → ${to})`}
                          amount={data.equity.netProfit}
                          negative={data.equity.netProfit < 0}
                        />
                        <SubtotalRow label="Total Equity" amount={data.equity.total} accent="text-green-800" />

                        <GrandTotalRow label="TOTAL LIABILITIES & EQUITY" amount={data.totalLiabilitiesAndEquity} colorClass="bg-red-800 text-white" />
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

              </div>
            </div>

          </motion.div>
        ) : (
          <Card className="bg-white border border-gray-100 rounded-xl shadow-sm">
            <CardContent className="py-20 text-center text-gray-400">No data available.</CardContent>
          </Card>
        )}

        {/* ── CONFIGURE TOGGLE ── */}
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => setShowConfig(p => !p)}
            className="w-full border-dashed border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-700 gap-2"
          >
            <Settings2 className="h-4 w-4" />
            {showConfig ? "Hide" : "Configure"} Manual Entries
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showConfig ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {/* ── CONFIGURE PANEL ── */}
        <AnimatePresence>
          {showConfig && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 space-y-4"
            >

              {/* Cash & Capital */}
              <Card className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="border-l-4 border-l-sky-400 bg-sky-50/30 px-5 py-3">
                  <h3 className="text-sm font-semibold text-sky-800">Cash & Capital</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Manually entered snapshot values</p>
                </div>

                {/* ── CURRENT VALUES ── */}
                <div className="px-5 pt-4 pb-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Current Values</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {([["cashInHand","Cash in Hand"],["cashAtBank","Cash at Bank"],["capitalAmount","Capital"]] as const).map(([key, lbl]) => (
                      <div key={key} className="rounded-lg border border-gray-100 bg-gray-50/60 px-4 py-3">
                        <p className="text-xs text-gray-400 mb-1">{lbl}</p>
                        <p className="text-base font-bold font-mono tabular-nums text-gray-900">{fmt(config[key])}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-gray-100 mx-5" />

                {/* ── UPDATE VALUES ── */}
                <CardContent className="px-5 py-4 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Update Values</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {([["cashInHand", "Cash in Hand (PKR)"], ["cashAtBank", "Cash at Bank (PKR)"], ["capitalAmount", "Capital / Initial Investment (PKR)"]] as const).map(([key, lbl]) => (
                      <div key={key}>
                        <label className="text-xs text-gray-500 font-medium mb-1.5 block">{lbl}</label>
                        <Input type="number" min={0} value={editConfig[key] === 0 ? "" : editConfig[key]} onChange={e => setEditConfig(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))} placeholder="0" />
                      </div>
                    ))}
                  </div>
                  <Button size="sm" onClick={saveConfig} disabled={savingConfig} className="bg-red-800 hover:bg-red-700 text-white">
                    {savingConfig ? "Saving…" : "Save"}
                  </Button>
                </CardContent>

                <div className="h-px bg-gray-100 mx-5" />

                {/* ── HISTORY TOGGLE + ADD ENTRY ── */}
                <div className="px-5 py-3 flex items-center gap-2">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => { setShowHistory(p => !p); setAddingHistoryEntry(false); setEditingHistoryId(null); }}
                    className="h-8 gap-1.5 text-gray-600 border-gray-200 hover:border-sky-300 hover:text-sky-700"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showHistory ? "rotate-180" : ""}`} />
                    {showHistory ? "Hide History" : "Show History"}
                    {configHistory.length > 0 && (
                      <span className="ml-1 bg-sky-100 text-sky-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{configHistory.length}</span>
                    )}
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => { setAddingHistoryEntry(p => !p); setShowHistory(true); setEditingHistoryId(null); }}
                    className="h-8 gap-1.5 text-gray-600 border-gray-200 hover:border-sky-300 hover:text-sky-700"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Entry
                  </Button>
                </div>

                {/* ── HISTORY SECTION ── */}
                <AnimatePresence>
                  {showHistory && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-gray-100">

                      {/* Add entry form */}
                      <AnimatePresence>
                        {addingHistoryEntry && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="px-5 py-4 bg-sky-50/30 border-b border-sky-100 space-y-3">
                              <p className="text-xs font-semibold text-sky-700">New History Entry</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                  <label className="text-xs text-gray-500 font-medium mb-1.5 block">Field</label>
                                  <select
                                    value={newHistoryEntry.field}
                                    onChange={e => setNewHistoryEntry(p => ({ ...p, field: e.target.value }))}
                                    className="w-full h-9 text-sm border border-input rounded-md px-3 bg-background"
                                  >
                                    <option value="cashInHand">Cash in Hand</option>
                                    <option value="cashAtBank">Cash at Bank</option>
                                    <option value="capitalAmount">Capital</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 font-medium mb-1.5 block">Previous Value (PKR)</label>
                                  <Input type="number" min={0} placeholder="0" value={newHistoryEntry.previousValue} onChange={e => setNewHistoryEntry(p => ({ ...p, previousValue: e.target.value }))} />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 font-medium mb-1.5 block">New Value (PKR)</label>
                                  <Input type="number" min={0} placeholder="0" value={newHistoryEntry.newValue} onChange={e => setNewHistoryEntry(p => ({ ...p, newValue: e.target.value }))} />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 font-medium mb-1.5 block">Date</label>
                                  <Input type="date" value={newHistoryEntry.changedAt} onChange={e => setNewHistoryEntry(p => ({ ...p, changedAt: e.target.value }))} />
                                </div>
                              </div>
                              <p className="text-xs text-sky-600">This will also update the current value for the selected field.</p>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={saveNewHistoryEntry} className="bg-red-800 hover:bg-red-700 text-white h-8">Save Entry</Button>
                                <Button size="sm" variant="ghost" onClick={() => setAddingHistoryEntry(false)} className="h-8">Cancel</Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <CardContent className="p-0 overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-gray-50/80">
                            <TableRow>
                              <TableHead className="font-semibold text-gray-900 whitespace-nowrap">Date & Time</TableHead>
                              <TableHead className="font-semibold text-gray-900 whitespace-nowrap">Field</TableHead>
                              <TableHead className="font-semibold text-gray-900 text-right whitespace-nowrap">Previous Value</TableHead>
                              <TableHead className="font-semibold text-gray-900 text-right whitespace-nowrap">New Value</TableHead>
                              <TableHead />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {configHistory.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-sm text-gray-400 italic py-6">
                                  No history yet. Values are recorded automatically when you save.
                                </TableCell>
                              </TableRow>
                            )}
                            {configHistory.map(h => (
                              editingHistoryId === h.id ? (
                                <TableRow key={h.id} className="bg-sky-50/40">
                                  <TableCell className="whitespace-nowrap">
                                    <Input type="date" value={editingHistoryRow.changedAt} onChange={e => setEditingHistoryRow(p => ({ ...p, changedAt: e.target.value }))} className="h-7 text-xs w-36" />
                                  </TableCell>
                                  <TableCell>
                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-100 whitespace-nowrap">
                                      {h.field === "cashInHand" ? "Cash in Hand" : h.field === "cashAtBank" ? "Cash at Bank" : "Capital"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Input type="number" min={0} value={editingHistoryRow.previousValue} onChange={e => setEditingHistoryRow(p => ({ ...p, previousValue: e.target.value }))} className="h-7 text-xs w-28 text-right ml-auto" />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Input type="number" min={0} value={editingHistoryRow.newValue} onChange={e => setEditingHistoryRow(p => ({ ...p, newValue: e.target.value }))} className="h-7 text-xs w-28 text-right ml-auto" />
                                  </TableCell>
                                  <TableCell className="text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button size="sm" onClick={saveHistoryEdit} className="bg-red-800 hover:bg-red-700 text-white h-7 px-3 text-xs">Save</Button>
                                      <Button size="sm" variant="ghost" onClick={() => setEditingHistoryId(null)} className="h-7 px-2 text-xs">Cancel</Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                <TableRow key={h.id} className="hover:bg-gray-50/50 transition-colors">
                                  <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                                    {new Date(h.changedAt).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}
                                  </TableCell>
                                  <TableCell>
                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-100 whitespace-nowrap">
                                      {h.field === "cashInHand" ? "Cash in Hand" : h.field === "cashAtBank" ? "Cash at Bank" : "Capital"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right text-sm font-mono tabular-nums text-gray-500 whitespace-nowrap">{fmt(h.previousValue)}</TableCell>
                                  <TableCell className="text-right text-sm font-mono tabular-nums font-semibold text-gray-900 whitespace-nowrap">{fmt(h.newValue)}</TableCell>
                                  <TableCell className="text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-0.5">
                                      <Button
                                        variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-sky-600"
                                        onClick={() => { setEditingHistoryId(h.id); setEditingHistoryRow({ newValue: String(h.newValue), previousValue: String(h.previousValue), changedAt: h.changedAt.slice(0, 10) }); setAddingHistoryEntry(false); }}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-300 hover:text-rose-500" onClick={() => deleteHistoryEntry(h.id)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Fixed Assets */}
              <Card className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="border-l-4 border-l-purple-400 bg-purple-50/20 px-5 py-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-purple-800">Fixed Assets</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Shop equipment with straight-line depreciation</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setAddingAsset(p => !p)} className="text-purple-700 hover:bg-purple-50 h-7 gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
                <CardContent className="p-0">
                  <AnimatePresence>
                    {addingAsset && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="col-span-2 sm:col-span-1">
                              <label className="text-xs text-gray-500 font-medium mb-1.5 block">Asset Name</label>
                              <Input placeholder="e.g. Shop Racks" value={newAsset.name} onChange={e => setNewAsset(p => ({ ...p, name: e.target.value }))} />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium mb-1.5 block">Initial Cost (PKR)</label>
                              <Input type="number" min={0} placeholder="150000" value={newAsset.initialCost} onChange={e => setNewAsset(p => ({ ...p, initialCost: e.target.value }))} />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium mb-1.5 block">Dep. Rate %/yr</label>
                              <Input type="number" min={0} max={100} value={newAsset.depreciationRate} onChange={e => setNewAsset(p => ({ ...p, depreciationRate: e.target.value }))} />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium mb-1.5 block">Purchase Date</label>
                              <Input type="date" value={newAsset.purchaseDate} onChange={e => setNewAsset(p => ({ ...p, purchaseDate: e.target.value }))} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveFixedAsset} disabled={savingAsset} className="bg-red-800 hover:bg-red-700 text-white h-8">{savingAsset ? "Saving…" : "Save Asset"}</Button>
                            <Button size="sm" variant="ghost" onClick={() => setAddingAsset(false)} className="h-8">Cancel</Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {fixedAssets.length === 0 ? (
                    <p className="text-sm text-gray-300 text-center py-6 italic">No fixed assets added yet.</p>
                  ) : (
                    <Table>
                      <TableHeader className="bg-gray-50/80">
                        <TableRow>
                          <TableHead className="font-semibold text-gray-700">Asset</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Cost</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Dep. %</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Net Value</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fixedAssets.map(a => (
                          <TableRow key={a.id} className="hover:bg-gray-50/50">
                            <TableCell className="font-medium text-gray-800 text-sm">{a.name}</TableCell>
                            <TableCell className="text-right text-sm font-mono text-gray-700 whitespace-nowrap">{fmt(a.initialCost)}</TableCell>
                            <TableCell className="text-right text-sm text-gray-500">{a.depreciationRate}%</TableCell>
                            <TableCell className="text-right text-sm font-mono font-semibold text-gray-900 whitespace-nowrap">{fmt(a.netValue)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-300 hover:text-rose-500" onClick={() => deleteFixedAsset(a.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Accrued Expenses */}
              <Card className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="border-l-4 border-l-orange-400 bg-orange-50/20 px-5 py-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-orange-800">Accrued Expenses</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Current month — salaries, rent, utilities</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setAddingExpense(p => !p)} className="text-orange-700 hover:bg-orange-50 h-7 gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
                <CardContent className="p-0">
                  <AnimatePresence>
                    {addingExpense && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-500 font-medium mb-1.5 block">Label</label>
                              <Input placeholder="e.g. Staff Salaries" value={newExpense.label} onChange={e => setNewExpense(p => ({ ...p, label: e.target.value }))} />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium mb-1.5 block">Amount (PKR)</label>
                              <Input type="number" min={0} placeholder="35000" value={newExpense.amount} onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveAccruedExpense} disabled={savingExpense} className="bg-red-800 hover:bg-red-700 text-white h-8">{savingExpense ? "Saving…" : "Save"}</Button>
                            <Button size="sm" variant="ghost" onClick={() => setAddingExpense(false)} className="h-8">Cancel</Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {accruedExpenses.length === 0 ? (
                    <p className="text-sm text-gray-300 text-center py-6 italic">No accrued expenses for this month.</p>
                  ) : (
                    <Table>
                      <TableHeader className="bg-gray-50/80">
                        <TableRow>
                          <TableHead className="font-semibold text-gray-700">Label</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Amount</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accruedExpenses.map(e => (
                          <TableRow key={e.id} className="hover:bg-gray-50/50">
                            <TableCell className="font-medium text-gray-800 text-sm">{e.label}</TableCell>
                            <TableCell className="text-right text-sm font-mono font-semibold text-gray-900 whitespace-nowrap">{fmt(e.amount)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-300 hover:text-rose-500" onClick={() => deleteAccruedExpense(e.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
    </>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Loading from "@/components/shared/Loading";
import { motion } from "framer-motion";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Printer,
  Receipt,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const QUICK_NAMES = [
  "Electricity bill",
  "Gas bill",
  "Salaries",
  "Full expenses",
  "Mobile expenses",
  "Other expenses",
];

/** Visible fields in dialogs (default shadcn border too faint). */
const FIELD_CLASS =
  "h-11 border-2 border-gray-300 bg-white text-gray-900 shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:border-red-600";

const SELECT_CLASS =
  "h-11 border-2 border-gray-300 bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-red-500/30 focus:border-red-600";

const LABEL_CLASS = "text-sm font-semibold text-gray-800";

export interface PersonalExpenseRow {
  id: string;
  name: string;
  expenseDate: string;
  accountNumber: string | null;
  debit: number;
  credit: number;
  notes: string | null;
  runningBalance: number;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n);
}

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function PersonalExpensesPage() {
  const { user } = useAuth();
  const token = user?.access_token;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [rows, setRows] = useState<PersonalExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState("");
  const [expenseDate, setExpenseDate] = useState(toDateInput(new Date()));
  const [accountNumber, setAccountNumber] = useState("");
  const [debit, setDebit] = useState("");
  const [credit, setCredit] = useState("");
  const [notes, setNotes] = useState("");

  const fetchRows = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const q = params.toString();
      const res = await fetch(
        `${base}/pharmacist/personal-expenses${q ? `?${q}` : ""}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("Failed to load expenses");
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Could not load personal expenses");
    } finally {
      setLoading(false);
    }
  }, [token, base, from, to]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const summary = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;
    for (const r of rows) {
      totalDebit += r.debit ?? 0;
      totalCredit += r.credit ?? 0;
    }
    return {
      totalDebit,
      totalCredit,
      net: totalDebit - totalCredit,
    };
  }, [rows]);

  const resetForm = () => {
    setEditId(null);
    setName("");
    setExpenseDate(toDateInput(new Date()));
    setAccountNumber("");
    setDebit("");
    setCredit("");
    setNotes("");
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (row: PersonalExpenseRow) => {
    setEditId(row.id);
    setName(row.name);
    setExpenseDate(toDateInput(new Date(row.expenseDate)));
    setAccountNumber(row.accountNumber ?? "");
    setDebit(row.debit > 0 ? String(row.debit) : "");
    setCredit(row.credit > 0 ? String(row.credit) : "");
    setNotes(row.notes ?? "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!token) return;
    const d = parseFloat(debit) || 0;
    const c = parseFloat(credit) || 0;
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }
    if (d <= 0 && c <= 0) {
      toast.error("Enter debit or credit");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        expenseDate,
        accountNumber: accountNumber.trim() || undefined,
        debit: d,
        credit: c,
        notes: notes.trim() || undefined,
      };
      if (editId) {
        await axios.patch(
          `${base}/pharmacist/personal-expenses/${editId}`,
          body,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success("Expense updated");
      } else {
        await axios.post(`${base}/pharmacist/personal-expenses`, body, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Expense added");
      }
      setDialogOpen(false);
      resetForm();
      await fetchRows();
    } catch (e) {
      const msg = axios.isAxiosError(e)
        ? (e.response?.data?.message as string) || e.message
        : "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !token) return;
    setDeleting(true);
    try {
      await axios.delete(`${base}/pharmacist/personal-expenses/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Deleted");
      setDeleteId(null);
      await fetchRows();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50/80 print:bg-white">
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="mb-6 no-print">
          <motion.h1
            className="text-2xl sm:text-3xl font-bold text-red-800 tracking-tight"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Personal Expenses
          </motion.h1>
          <motion.p
            className="mt-1 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Track shop costs (bills, salaries, etc.). Net expenses deduct from
            Profit &amp; Loss and dashboard net profit.
          </motion.p>
        </header>

        <Card className="mb-6 border border-gray-200 shadow-sm no-print">
          <CardContent className="p-5 flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="from" className={LABEL_CLASS}>
                  From
                </Label>
                <Input
                  id="from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className={FIELD_CLASS}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="to" className={LABEL_CLASS}>
                  To
                </Label>
                <Input
                  id="to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className={FIELD_CLASS}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFrom("");
                  setTo("");
                }}
              >
                Clear dates
              </Button>
              <Button
                className="bg-red-800 hover:bg-red-700"
                onClick={openCreate}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add expense
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="border-amber-100 bg-amber-50/30">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-amber-800 uppercase">
                Total debit (out)
              </p>
              <p className="text-2xl font-bold text-amber-700">
                {formatCurrency(summary.totalDebit)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-green-100 bg-green-50/30">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-green-800 uppercase">
                Total credit (in)
              </p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(summary.totalCredit)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-red-100 bg-red-50/30">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-red-800 uppercase">
                Net expenses
              </p>
              <p className="text-2xl font-bold text-red-700">
                {formatCurrency(summary.net)}
              </p>
              <p className="text-xs text-gray-500 mt-1 hidden print:block">
                Deducted from P&amp;L net profit in same date range
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border border-gray-200 print:border-black">
          <div className="hidden print:block p-4 border-b text-center">
            <h2 className="text-lg font-bold">Personal Expenses</h2>
            <p className="text-sm text-gray-600">
              {from || to
                ? `${from || "…"} — ${to || "…"}`
                : "All dates"}
            </p>
          </div>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 flex justify-center no-print">
                <Loading />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-red-50/80 border-b text-left text-red-900">
                      <th className="p-3 font-semibold">Name</th>
                      <th className="p-3 font-semibold">Date</th>
                      <th className="p-3 font-semibold">Account no</th>
                      <th className="p-3 font-semibold text-right">Debit</th>
                      <th className="p-3 font-semibold text-right">Credit</th>
                      <th className="p-3 font-semibold text-right">Balance</th>
                      <th className="p-3 font-semibold no-print w-28">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-8 text-center text-gray-500"
                        >
                          No expenses yet. Add electricity, gas, salaries, etc.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b hover:bg-gray-50/50"
                        >
                          <td className="p-3">{row.name}</td>
                          <td className="p-3 whitespace-nowrap">
                            {new Date(row.expenseDate).toLocaleDateString(
                              "en-PK",
                            )}
                          </td>
                          <td className="p-3">{row.accountNumber || "—"}</td>
                          <td className="p-3 text-right tabular-nums">
                            {row.debit > 0
                              ? formatCurrency(row.debit)
                              : "—"}
                          </td>
                          <td className="p-3 text-right tabular-nums">
                            {row.credit > 0
                              ? formatCurrency(row.credit)
                              : "—"}
                          </td>
                          <td className="p-3 text-right font-medium tabular-nums">
                            {formatCurrency(row.runningBalance)}
                          </td>
                          <td className="p-3 no-print">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(row)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => setDeleteId(row.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {rows.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold border-t">
                        <td colSpan={3} className="p-3 text-right">
                          Totals
                        </td>
                        <td className="p-3 text-right">
                          {formatCurrency(summary.totalDebit)}
                        </td>
                        <td className="p-3 text-right">
                          {formatCurrency(summary.totalCredit)}
                        </td>
                        <td className="p-3 text-right text-red-800">
                          {formatCurrency(summary.net)}
                        </td>
                        <td className="no-print" />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </CardContent>
          <p className="p-4 text-xs text-gray-500 border-t print:text-center">
            <Receipt className="inline h-3 w-3 mr-1" />
            Net expenses (debit − credit) reduce net profit on Profit &amp; Loss
            report and dashboard for the same period.
          </p>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden border-2 border-gray-200 shadow-xl">
          <DialogHeader className="px-6 py-4 border-b-2 border-red-700 bg-red-50/50 space-y-1">
            <DialogTitle className="text-xl text-red-900">
              {editId ? "Edit expense" : "Add expense"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-left">
              <span className="font-medium text-amber-800">Debit</span> = money
              out · <span className="font-medium text-green-800">Credit</span>{" "}
              = refund or adjustment in
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-5 bg-gray-50/90 space-y-4 max-h-[min(70vh,520px)] overflow-y-auto">
            <div className="space-y-1.5">
              <Label className={LABEL_CLASS}>Quick pick</Label>
              <Select
                onValueChange={(v) => {
                  if (v !== "__none__") setName(v);
                }}
                value={QUICK_NAMES.includes(name) ? name : "__none__"}
              >
                <SelectTrigger className={SELECT_CLASS}>
                  <SelectValue placeholder="Choose category (optional)" />
                </SelectTrigger>
                <SelectContent className="border-2 border-gray-200">
                  <SelectItem value="__none__">— Custom name below —</SelectItem>
                  {QUICK_NAMES.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className={LABEL_CLASS}>
                Name <span className="text-red-600">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Electricity bill"
                className={FIELD_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <Label className={LABEL_CLASS}>
                Date <span className="text-red-600">*</span>
              </Label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className={FIELD_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <Label className={LABEL_CLASS}>Account no</Label>
              <Input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Optional reference / account"
                className={FIELD_CLASS}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 rounded-lg border-2 border-amber-200 bg-amber-50/40 p-3">
                <Label className={`${LABEL_CLASS} text-amber-900`}>
                  Debit (out)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={debit}
                  onChange={(e) => setDebit(e.target.value)}
                  placeholder="0"
                  className={`${FIELD_CLASS} border-amber-300 focus-visible:border-amber-600 focus-visible:ring-amber-500/30 tabular-nums`}
                />
              </div>
              <div className="space-y-1.5 rounded-lg border-2 border-green-200 bg-green-50/40 p-3">
                <Label className={`${LABEL_CLASS} text-green-900`}>
                  Credit (in)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={credit}
                  onChange={(e) => setCredit(e.target.value)}
                  placeholder="0"
                  className={`${FIELD_CLASS} border-green-300 focus-visible:border-green-600 focus-visible:ring-green-500/30 tabular-nums`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className={LABEL_CLASS}>Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
                className={FIELD_CLASS}
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-gray-200 bg-white gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 border-2 border-gray-300"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-11 min-w-[120px] bg-red-800 hover:bg-red-700 text-white shadow-md"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-md border-2 border-gray-200 p-6">
          <DialogHeader>
            <DialogTitle className="text-red-900">Delete expense?</DialogTitle>
            <DialogDescription className="text-gray-600">
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-3 pt-2">
            <Button
              variant="outline"
              className="h-10 border-2 border-gray-300"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="h-10"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

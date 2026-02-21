# Medical Store – Feature Audit & Implementation Task List

This document compares your requested features (from the attached screenshots) with the current **Medical-Store** frontend and **nhs-ibrahim-backend** implementation, and lists tasks for what still needs to be built.

---

## User roles and where changes apply

| Role | App path | Responsibility |
|------|----------|-----------------|
| **admin** | `app/(root)/admin/` | View/manage operations and staff (doctors, nurses, pharmacists, frontdesk). |
| **frontdesk** | `app/(root)/frontdesk/` | Patients (add, edit, search), visits. |
| **doctor** | `app/(root)/doctor/` | Doctor dashboard and patient care. |
| **nurse** | `app/(root)/nurse/` | Patient details, view patient info. |
| **pharmacist** | `app/(root)/pharmacist/` | Inventory, sales & billing, purchase orders, manufacturers (suppliers). |

**For the new features in this document:** all Inventory, Sales & Billing, Purchase & Supplier, and Customer tasks are implemented in the **pharmacist** area (backend: `pharmacist` controller/service; frontend: `app/(root)/pharmacist/`). The **admin** role may get read-only reports or dashboards later (optional). No changes are required for **frontdesk**, **doctor**, or **nurse** for these feature sets unless you later decide to expose customer lookup to frontdesk or reports to admin.

---

## 1. INVENTORY

**Role(s):** **pharmacist**  
**Frontend:** `app/(root)/pharmacist/inventory-management/`, `app/(root)/pharmacist/inventory-view/`  
**Backend:** `pharmacist` controller/service, inventory DTOs

| Feature | Status | Notes |
|--------|--------|--------|
| Complete medicine database | ✅ **Available** | `InventoryItem` (MEDICINE, INJECTION, SURGERY, GENERAL), CRUD, list, view. |
| Batch tracking | ✅ **Available** | `batchNumber` on items; used in forms and DataTable. |
| Expiry date | ✅ **Available** | `expiryDate`; expiry warning in table; `getExpiringItems()` API. |
| Manufacturer / company details | ✅ **Available** | `Manufacturer` model; create/list; linked to inventory; manufacturer-working page. |
| Purchase price & selling price | ❌ **Needs implementation** | Only single `price` exists. Need separate cost and selling price. |
| Low stock alerts | ⚠️ **Partial** | `minimumStock` and low-stock API/page exist; **fix:** low-stock filter compares quantity incorrectly (should be quantity &lt; minimumStock). |
| Barcode support | ❌ **Needs implementation** | No `barcode` in schema; sales barcode input present but commented out; no lookup by barcode. |
| Category-wise medicine management | ⚠️ **Partial** | `category` field exists; filtering is by **type** only; no dedicated category filter or category-wise views. |

---

## 2. SALES & BILLING SYSTEM

**Role(s):** **pharmacist**  
**Frontend:** `app/(root)/pharmacist/sales/`, `app/(root)/pharmacist/sales-history/`, `app/(root)/pharmacist/history/`, `components/Receipt.tsx`  
**Backend:** `pharmacist` controller/service, sale DTOs

| Feature | Status | Notes |
|--------|--------|--------|
| Fast invoice generation | ❌ **Needs implementation** | No invoice number or invoice entity; sale has `id` only. |
| Barcode scanning | ❌ **Needs implementation** | Barcode input on sales page exists but is not wired; no product-by-barcode API. |
| Printed or digital receipts | ✅ **Available** | `Receipt.tsx` with order#, date, items, discount, total, print; “Print Bill” on sales page. |
| Discount percentage | ✅ **Available** | `discount` in sale DTO and applied; shown on sales page and receipt. |
| Sale refund | ❌ **Needs implementation** | No refund API, no refund flow, no reverse stock or refund records. |
| Payment method (Cash, Card, Online, Donation) | ❌ **Needs implementation** | Receipt shows “Cash Tendered” only; no payment method stored on `Sale` or in UI. |

---

## 3. PURCHASE & SUPPLIER MANAGEMENT

**Role(s):** **pharmacist**  
**Frontend:** `app/(root)/pharmacist/purchase-orders/`, `app/(root)/pharmacist/manufacturer-working/`  
**Backend:** `pharmacist` controller/service, manufacturer & purchase-order DTOs

| Feature | Status | Notes |
|--------|--------|--------|
| Supplier name, cell no., address | ⚠️ **Partial** | Implemented as **Manufacturer**: companyName, phone; address via country/city/province (no single address line). |
| Bill and invoice (supplier) | ❌ **Needs implementation** | No supplier bill/invoice attachment or invoice number. |
| Credit or balance (supplier) | ✅ **Available** | `Manufacturer.balance`; shown on manufacturer-working page. |
| Order history (supplier) | ✅ **Available** | Purchase orders linked to manufacturer; list by manufacturer. |
| Purchase invoice entry | ❌ **Needs implementation** | No “purchase invoice” entity (received bill with line items, costs). Only PurchaseOrder (item, quantity, status). |
| Purchase per piece discount | ❌ **Needs implementation** | No per-unit or line-level discount on purchase. |
| Automatic stock update | ✅ **Available** | When order status = DELIVERED, stock is incremented. |
| Purchase history tracking | ✅ **Available** | Purchase orders list with status; view and mark delivered/cancel. |
| Supplier payment tracking | ❌ **Needs implementation** | Balance exists; no payment transactions (payments/adjustments/history). |

---

## 4. CUSTOMER

**Role(s):** **pharmacist** (primary); optionally **admin** for reports later  
**Frontend:** New pages under `app/(root)/pharmacist/` (e.g. customers list, customer detail with purchase history); sales page for customer selection  
**Backend:** New `Customer` model and APIs (under `pharmacist` or shared module)

| Feature | Status | Notes |
|--------|--------|--------|
| Regular customer records | ❌ **Needs implementation** | No `Customer` model; only optional `customerName` and `customerPhone` on each Sale. |
| Purchase history (per customer) | ❌ **Needs implementation** | Cannot list “all sales for this customer” without customer entity. |
| Credit balance tracking | ❌ **Needs implementation** | No customer credit/balance. |
| SMS or email reminder | ❌ **Needs implementation** | No reminder or notification flow; no SMS/email integration. |

---

# Implementation Task List

Tasks below are ordered by area. Implement in an order that fits your priorities (e.g. Customer first if you need loyalty/reminders).

---

## Inventory

**Role:** pharmacist

- [ ] **INV-1** Add **purchase price (cost)** and **selling price** to inventory  
  - Schema: add e.g. `purchasePrice` and `sellingPrice` (or keep `price` as selling and add `cost`).  
  - Update DTOs, forms, and any reports that use price.

- [ ] **INV-2** Fix **low stock** logic  
  - In backend, ensure low-stock filter uses `quantity < minimumStock` (correct comparison).  
  - Verify frontend low-stock list and badges.

- [ ] **INV-3** Add **barcode support**  
  - Schema: add `barcode` (or reuse `productCode`) on `InventoryItem`; ensure create/update DTOs and forms include it.  
  - Backend: add API to find product by barcode (e.g. `GET /pharmacist/inventory/by-barcode/:barcode`).  
  - Frontend: enable barcode input on sales page and wire it to barcode lookup.

- [ ] **INV-4** Strengthen **category-wise medicine management**  
  - Add category filter to inventory list/view.  
  - Optionally: category dropdown from existing data, or category-wise report/page.

---

## Sales & Billing

**Role:** pharmacist

- [ ] **SAL-1** Add **invoice number / invoice generation**  
  - Backend: add `invoiceNumber` (or similar) on `Sale`; generate unique numbers (sequence or pattern).  
  - Frontend: show invoice number on receipt and in sales history.

- [ ] **SAL-2** Support **payment method** (Cash, Card, Online, Donation)  
  - Schema: add `paymentMethod` enum on `Sale` (e.g. CASH, CARD, ONLINE, DONATION).  
  - DTOs and sales form: include payment method.  
  - Receipt: show selected payment method instead of only “Cash Tendered”.

- [ ] **SAL-3** Implement **sale refund**  
  - Backend: refund API (e.g. full/partial refund); create refund record; reverse or adjust stock.  
  - Frontend: refund action from sale detail/history; optional refund receipt.

- [ ] **SAL-4** Complete **barcode scanning** for sales  
  - Depends on INV-3. Wire sales page barcode input to “add item by barcode” using the new barcode API.

---

## Purchase & Supplier

**Role:** pharmacist

- [ ] **PUR-1** **Supplier/Manufacturer address**  
  - Add a single `address` (or `addressLine`) field to Manufacturer if you need full address in addition to city/province/country.

- [ ] **PUR-2** **Supplier bill and invoice**  
  - Add support for supplier invoice number and/or document (e.g. on PurchaseOrder or new PurchaseInvoice entity).  
  - UI to enter and show supplier invoice/reference.

- [ ] **PUR-3** **Purchase invoice entry** (received bill with line items)  
  - Consider a PurchaseInvoice (or similar) model: supplier, date, invoice number, line items (product, qty, unit cost, discount).  
  - Optional: link to PurchaseOrder or keep as separate “received purchase” record.  
  - Automatic stock update when purchase invoice is confirmed.

- [ ] **PUR-4** **Purchase per piece discount**  
  - Add per-line or per-piece discount on purchase (e.g. on PurchaseOrder line or PurchaseInvoice line).  
  - Use in cost calculation and any reporting.

- [ ] **PUR-5** **Supplier payment tracking**  
  - Add payment transactions (e.g. SupplierPayment: amount, date, reference, manufacturerId).  
  - Update Manufacturer.balance from payments; list payment history per supplier.

---

## Customer

**Role:** pharmacist (primary); optionally admin for reports

- [ ] **CUS-1** **Regular customer records**  
  - Add `Customer` model (e.g. name, phone, email, address).  
  - CRUD APIs and a customer list/detail UI.

- [ ] **CUS-2** **Link sales to customer**  
  - Add optional `customerId` on `Sale`; keep customerName/customerPhone for quick entry or fallback.  
  - When selecting a customer, fill name/phone and set customerId.

- [ ] **CUS-3** **Customer purchase history**  
  - API to list sales by customerId.  
  - Frontend: “Purchase history” tab or page per customer.

- [ ] **CUS-4** **Customer credit balance tracking**  
  - Add `creditBalance` (or similar) on Customer; track adjustments (sales on credit, payments).  
  - UI to show balance and simple history.

- [ ] **CUS-5** **SMS or email reminder**  
  - Design: which events trigger reminders (e.g. refill, expiry, follow-up).  
  - Integrate SMS/email provider (e.g. Twilio, SendGrid); store preferences and send reminders.  
  - Optional: reminder log per customer.

---

## Summary

| Area | Available | Partial | Needs implementation |
|------|-----------|---------|----------------------|
| Inventory | 5 | 2 | 2 (prices, barcode) + 1 fix + 1 enhancement |
| Sales & Billing | 3 | 0 | 4 (invoice, barcode, refund, payment method) |
| Purchase & Supplier | 4 | 1 | 5 (address, bill/invoice, purchase invoice, per-piece discount, payment tracking) |
| Customer | 0 | 0 | 5 (records, link sales, history, credit, reminders) |

**Total tasks listed:** 18 (including one bug fix and one enhancement).

Use this file as a checklist; tick tasks in the “Implementation Task List” as you complete them. If you tell me which area you want to tackle first (e.g. “Customer” or “Sales refund”), I can outline concrete schema changes and API/UI steps next.

---

## Role → tasks quick reference

| Role | Areas and tasks |
|------|------------------|
| **pharmacist** | All Inventory (INV-1–INV-4), Sales & Billing (SAL-1–SAL-4), Purchase & Supplier (PUR-1–PUR-5), and Customer (CUS-1–CUS-5). Implement in `app/(root)/pharmacist/` and backend `pharmacist` module. |
| **admin** | No tasks required for the feature set above. Optional later: read-only reports/dashboards (e.g. sales summary, customer list). |
| **frontdesk** | No changes for these features. |
| **doctor** | No changes for these features. |
| **nurse** | No changes for these features. |

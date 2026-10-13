import { api } from "@/lib/apiClient";
import { Book, BookSale, StudentBookRow } from "@/lib/types";
import { notifyFinancialChange } from "@/lib/financialEvents";

// ── Types for the unified sell-by-code endpoint ──────────────────────────────

export interface SellByCodePricing {
  price: number;
  discount: number;
  discount_pct: number;
  is_exempt: boolean;
  final_price: number;
  discount_reason: string | null;
}

export interface SellByCodeStudentSummary {
  id: string;
  name: string;
  code: string;
}

export interface SellByCodeBookSummary {
  id: string;
  name: string;
  price: number;
}

export interface SellByCodeAlreadyPurchased {
  sale_id: string;
  purchase_date: string;
  amount: number;
}

/** Backend returns needs_confirmation:false → sale was created */
export interface SellByCodeSaleCreated {
  needs_confirmation: false;
  sale: BookSale;
  student: SellByCodeStudentSummary;
  book: SellByCodeBookSummary;
  pricing: SellByCodePricing;
  message: string;
}

/** Backend returns needs_confirmation:true → teacher must confirm */
export interface SellByCodeNeedsConfirm {
  needs_confirmation: true;
  reason: "already_purchased" | "has_discount";
  student: SellByCodeStudentSummary;
  book: SellByCodeBookSummary;
  pricing: SellByCodePricing;
  already_purchased: SellByCodeAlreadyPurchased | null;
}

export type SellByCodeResult = SellByCodeSaleCreated | SellByCodeNeedsConfirm;

// ── Book details response (returned by GET /books/:id/details) ───────────────
export interface BookDetailsRow {
  student_id: string;
  name: string;
  code: string;
  group_id: string;
  purchased: boolean;
  paid: boolean;
  purchase_date: string | null;
  amount: number | null;
  final_price: number | null;
  discount: number | null;
  is_exempt: boolean;
  receipt_number: string | null;
  sale_id: string | null;
  extra_sales: Array<{
    sale_id: string;
    purchase_date: string | null;
    amount: number | null;
    final_price: number | null;
    discount: number | null;
    is_exempt: boolean;
  }>;
}

export interface BookDetails {
  book: Book;
  buyers_count: number;
  total_revenue: number;
  not_purchased_count: number;
  students: BookDetailsRow[];
}

// ── Lookup response (GET /books/lookup-student) ──────────────────────────────
export interface LookupStudentResult {
  student: Record<string, unknown>;
  book: Record<string, unknown>;
  pricing: SellByCodePricing;
  already_purchased: SellByCodeAlreadyPurchased | null;
}

// ── Books report ─────────────────────────────────────────────────────────────
export interface BooksReport {
  total_books: number;
  total_sales: number;
  total_revenue: number;
  total_discount: number;
  total_exempt: number;
  best_book: { id: string; name: string; sales: number } | null;
  not_bought_count: number;
  per_book: Array<{
    book_id: string;
    name: string;
    price: number;
    sales_count: number;
    revenue: number;
    discount: number;
    exempt_count: number;
  }>;
}

// ── Service ──────────────────────────────────────────────────────────────────

export const BooksService = {
  getBooks: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return api.get<Book[]>(`/books${q}`);
  },
  getBookById: (id: string) => api.get<Book>(`/books/${id}`),
  createBook: (data: Partial<Book>) => api.post<Book>("/books", data),
  updateBook: (id: string, data: Partial<Book>) => api.patch<Book>(`/books/${id}`, data),
  deleteBook: (id: string) => api.delete(`/books/${id}`),
  getBookDetails: (id: string) => api.get<BookDetails>(`/books/${id}/details`),
  lookupStudentForSale: (studentCode: string, bookId: string) =>
    api.get<LookupStudentResult>(
      `/books/lookup-student?student_code=${encodeURIComponent(studentCode)}&book_id=${bookId}`
    ),
  sellBook: async (data: { book_id: string; student_id: string; force_resell?: boolean }) => {
    const result = await api.post<BookSale>("/books/sell", data);
    notifyFinancialChange();
    return result;
  },
  /**
   * Unified sell-by-code: single HTTP request that validates, prices, and
   * creates the sale server-side. Returns either:
   *   { needs_confirmation: false, sale, student, book, pricing }  → sale created
   *   { needs_confirmation: true,  reason, student, book, pricing, already_purchased? } → show confirmation UI
   */
  sellByCode: async (data: {
    student_code?: string;
    student_id?: string;
    book_id: string;
    force_resell?: boolean;
  }): Promise<SellByCodeResult> => {
    const result = await api.post<SellByCodeResult>("/books/sell-by-code", data);
    if (result && !result.needs_confirmation) notifyFinancialChange();
    return result;
  },
  cancelSale: async (saleId: string, cancel_reason?: string) => {
    const result = await api.patch(`/books/sales/${saleId}/cancel`, { cancel_reason });
    notifyFinancialChange();
    return result;
  },
  getSales: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return api.get<BookSale[]>(`/books/sales${q}`);
  },
  getStudentBooks: (studentId: string) => api.get<StudentBookRow[]>(`/books/student/${studentId}`),
  getReport: () => api.get<BooksReport>("/books/report"),
  getStudentBookCounts: () => api.get<Record<string, string[]>>("/books/sales-count"),
  markSalePaid: async (saleId: string) => {
    const result = await api.patch(`/books/sales/${saleId}/mark-paid`, {});
    notifyFinancialChange();
    return result;
  },
  markSaleUnpaid: async (saleId: string) => {
    const result = await api.patch(`/books/sales/${saleId}/mark-unpaid`, {});
    notifyFinancialChange();
    return result;
  },
  sellExempt: async (data: { book_id: string; student_id: string }) => {
    const result = await api.post("/books/sell-exempt", data);
    notifyFinancialChange();
    return result;
  },
};

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/services/authService";
import { api } from "@/lib/apiClient";
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Mail,
  UserCheck,
  UserX,
  Shield,
  Layers,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface SubscriptionItem {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    teacherCode?: string;
    is_active: boolean;
    provisioning_status?: string;
    is_email_verified?: boolean;
    created_at?: string;
  } | null;
  polarCustomerId: string;
  polarSubscriptionId: string;
  polarProductId: string;
  productName?: string;
  customerEmail: string;
  customerName?: string;
  status: string;
  billingInterval: string;
  currency: string;
  amount: number;
  startedAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  lastWebhookEvent?: string;
  lastWebhookAt?: string;
  createdAt: string;
}

interface StatsData {
  [status: string]: { count: number; totalAmount: number };
}

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [stats, setStats] = useState<StatsData>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const checkAdmin = useCallback(async () => {
    const user = await AuthService.getUser();
    if (!user || !(user as any).is_super_admin) {
      router.replace("/admin/login");
      return false;
    }
    return true;
  }, [router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(search ? { search } : {}),
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      });

      const res = await api.get<{
        subscriptions: SubscriptionItem[];
        total: number;
        page: number;
        pages: number;
        stats: StatsData;
      }>(`/polar/admin/subscriptions?${queryParams.toString()}`);

      setSubscriptions(res.subscriptions || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
      setStats(res.stats || {});
    } catch (err: any) {
      console.error("Failed to load polar subscriptions:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    checkAdmin().then((isAuthorized) => {
      if (isAuthorized) loadData();
    });
  }, [checkAdmin, loadData]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> نشط (Active)
          </span>
        );
      case "pending_verification":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> بانتظار التأكيد
          </span>
        );
      case "canceled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> ملغي (Canceled)
          </span>
        );
      case "revoked":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <AlertCircle className="w-3 h-3" /> منتهي (Revoked)
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <RefreshCw className="w-3 h-3" /> مسترد (Refunded)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  const getTeacherAccountBadge = (user: SubscriptionItem["userId"]) => {
    if (!user) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-400">
          غير مرتبط
        </span>
      );
    }

    if (user.provisioning_status === "pending_activation" || !user.is_active) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
          <Clock className="w-3 h-3" /> بانتظار تفعيل المعلم
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-teal-500/10 text-teal-300 border border-teal-500/20">
        <UserCheck className="w-3 h-3" /> مفعّل ({user.teacherCode || "كود مسجل"})
      </span>
    );
  };

  const totalActiveRevenue = Object.entries(stats).reduce((acc, [s, d]) => {
    if (s === "active") return acc + (d.totalAmount || 0);
    return acc;
  }, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-teal-400" />
            اشتراكات Polar Payments
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            سجل الاشتراكات المؤتمتة عبر بوابة Polar، وحالة تجهيز حسابات المعلمين وتأكيد ملكية البريد.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          تحديث البيانات
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="text-xs text-slate-400 mb-1">إجمالي العمليات</div>
          <div className="text-2xl font-bold text-white">{total}</div>
          <div className="text-[11px] text-slate-500 mt-1">عمليات الشراء المسجلة</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="text-xs text-emerald-400 mb-1">الاشتراكات النشطة</div>
          <div className="text-2xl font-bold text-emerald-300">
            {stats["active"]?.count || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">معلمون لديهم وصول نشط</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="text-xs text-amber-400 mb-1">بانتظار التأكيد أو التفعيل</div>
          <div className="text-2xl font-bold text-amber-300">
            {stats["pending_verification"]?.count || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">تم إرسال روابط بريدية</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="text-xs text-teal-400 mb-1">العوائد النشطة (تقريبية)</div>
          <div className="text-2xl font-bold text-teal-300">
            ${totalActiveRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">من الاشتراكات النشطة</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="بحث بالبريد، اسم المعلم، معرف الاشتراك أو العميل..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">كل الحالات</option>
            <option value="active">نشط (Active)</option>
            <option value="pending_verification">بانتظار التأكيد (Pending)</option>
            <option value="canceled">ملغي (Canceled)</option>
            <option value="revoked">منتهي (Revoked)</option>
            <option value="refunded">مسترد (Refunded)</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="p-3.5 sm:p-4">المعلم والبريد الإلكتروني</th>
                <th className="p-3.5 sm:p-4">حالة الحساب والتجهيز</th>
                <th className="p-3.5 sm:p-4">معرّفات Polar</th>
                <th className="p-3.5 sm:p-4">المنتج والقيمة</th>
                <th className="p-3.5 sm:p-4">حالة الاشتراك</th>
                <th className="p-3.5 sm:p-4">الفترة والصلاحية</th>
                <th className="p-3.5 sm:p-4">آخر Webhook</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-400" />
                    جاري تحميل سجل الاشتراكات...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    لا توجد اشتراكات مسجلة تطابق شروط البحث.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Teacher & Email */}
                    <td className="p-3.5 sm:p-4">
                      <div className="font-semibold text-white">
                        {sub.customerName || sub.userId?.name || "معلم جديد"}
                      </div>
                      <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                        {sub.customerEmail}
                      </div>
                      {sub.userId?.teacherCode && (
                        <div className="inline-block mt-1 font-mono text-[10px] text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
                          {sub.userId.teacherCode}
                        </div>
                      )}
                    </td>

                    {/* Account Provisioning State */}
                    <td className="p-3.5 sm:p-4 space-y-1">
                      <div>{getTeacherAccountBadge(sub.userId)}</div>
                      <div className="text-[11px] text-slate-400">
                        {sub.userId?.is_email_verified ? (
                          <span className="text-emerald-400">✓ بريد موثق</span>
                        ) : (
                          <span className="text-slate-500">غير موثق بعد</span>
                        )}
                      </div>
                    </td>

                    {/* Polar IDs */}
                    <td className="p-3.5 sm:p-4 font-mono text-[11px] text-slate-300 space-y-1">
                      <div title={sub.polarSubscriptionId}>
                        <span className="text-slate-500">Sub: </span>
                        {sub.polarSubscriptionId.slice(0, 14)}...
                      </div>
                      <div title={sub.polarCustomerId}>
                        <span className="text-slate-500">Cus: </span>
                        {sub.polarCustomerId.slice(0, 14)}...
                      </div>
                    </td>

                    {/* Product & Price */}
                    <td className="p-3.5 sm:p-4">
                      <div className="font-medium text-white">{sub.productName || "اشتراك نظامها"}</div>
                      <div className="text-[11px] text-teal-300 font-semibold mt-0.5">
                        {sub.amount} {sub.currency} / {sub.billingInterval === "year" ? "سنوياً" : "شهرياً"}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-3.5 sm:p-4">{getStatusBadge(sub.status)}</td>

                    {/* Dates */}
                    <td className="p-3.5 sm:p-4 text-[11px] text-slate-300 space-y-0.5">
                      <div>
                        <span className="text-slate-500">البدء: </span>
                        {formatDate(sub.startedAt || sub.createdAt)}
                      </div>
                      <div>
                        <span className="text-slate-500">التجديد: </span>
                        {formatDate(sub.currentPeriodEnd)}
                      </div>
                      {sub.cancelAtPeriodEnd && (
                        <div className="text-rose-400 font-semibold text-[10px]">
                          ⚠️ ينتهي بنهاية الفترة
                        </div>
                      )}
                    </td>

                    {/* Last Webhook */}
                    <td className="p-3.5 sm:p-4 text-[11px]">
                      <div className="font-mono text-teal-300">
                        {sub.lastWebhookEvent || "—"}
                      </div>
                      <div className="text-slate-500 text-[10px] mt-0.5">
                        {formatDate(sub.lastWebhookAt)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              صفحة {page} من {pages} (إجمالي {total} اشتراك)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              >
                السابق
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

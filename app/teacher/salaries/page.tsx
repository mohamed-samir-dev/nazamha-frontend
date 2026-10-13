"use client";

import { Wallet, Plus, AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

import { useSalariesPage } from "./_hooks/useSalariesPage";
import { SalariesKpiCards } from "./_components/SalariesKpiCards";
import { SalariesTable } from "./_components/SalariesTable";
import { SalaryFormModal } from "./_components/SalaryFormModal";

export default function SalariesPage() {
  const {
    viewMode, setViewMode,
    loading, actionLoading, error, toast,
    showForm, setShowForm, editingId, form, setForm, formError,
    filterMonth, setFilterMonth, filterYear, setFilterYear,
    deleteConfirm, setDeleteConfirm,
    filtered, totalMonth, totalYear, employeeCount, availableYears,
    openAdd, openEdit, handleSubmit, handleDelete, handleConfirmPayment,
  } = useSalariesPage();

  if (loading) return <Spinner fullScreen />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wallet size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: "clamp(1.2rem,3vw,1.6rem)", marginBottom: "0.1rem" }}>الرواتب والمصروفات</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>إدارة الرواتب والمصروفات الشخصية — إيجار، فواتير، وغيرها</p>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {/* Toggle View Mode */}
            <div style={{ display: "flex", background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.25rem" }}>
              <button
                onClick={() => setViewMode("salaries")}
                style={{
                  padding: "0.4rem 0.9rem",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  background: viewMode === "salaries" ? "rgba(168,85,247,0.15)" : "transparent",
                  color: viewMode === "salaries" ? "#a855f7" : "var(--text-muted)",
                  transition: "all 0.2s"
                }}
              >
                رواتب العاملين
              </button>
              <button
                onClick={() => setViewMode("expenses")}
                style={{
                  padding: "0.4rem 0.9rem",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  background: viewMode === "expenses" ? "rgba(239,68,68,0.15)" : "transparent",
                  color: viewMode === "expenses" ? "#ef4444" : "var(--text-muted)",
                  transition: "all 0.2s"
                }}
              >
                المصروفات
              </button>
            </div>

            <button
              onClick={openAdd}
              className="btn"
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1.1rem", borderRadius: 10, cursor: "pointer", background: viewMode === "salaries" ? "rgba(168,85,247,0.15)" : "rgba(239,68,68,0.15)", color: viewMode === "salaries" ? "#a855f7" : "#ef4444", border: viewMode === "salaries" ? "1px solid rgba(168,85,247,0.3)" : "1px solid rgba(239,68,68,0.3)", fontSize: "0.88rem", fontWeight: 600, fontFamily: "inherit" }}
            >
              <Plus size={16} /> {viewMode === "salaries" ? "إضافة راتب" : "إضافة مصروف"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-toast alert-error" style={{ marginBottom: "1rem" }}>
          <AlertCircle size={16} /><span>{error}</span>
        </div>
      )}

      <SalariesKpiCards
        viewMode={viewMode}
        filterMonth={filterMonth}
        filterYear={filterYear}
        totalMonth={totalMonth}
        totalYear={totalYear}
        employeeCount={employeeCount}
        filteredCount={filtered.length}
      />

      <SalariesTable
        viewMode={viewMode}
        filtered={filtered}
        totalMonth={totalMonth}
        filterMonth={filterMonth}
        filterYear={filterYear}
        availableYears={availableYears}
        deleteConfirm={deleteConfirm}
        actionLoading={actionLoading}
        setFilterMonth={setFilterMonth}
        setFilterYear={setFilterYear}
        setDeleteConfirm={setDeleteConfirm}
        onEdit={openEdit}
        onDelete={handleDelete}
        onConfirmPayment={handleConfirmPayment}
      />

      {showForm && (
        <SalaryFormModal
          viewMode={viewMode}
          editingId={editingId}
          form={form}
          formError={formError}
          actionLoading={actionLoading}
          setForm={setForm}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
        />
      )}

      {toast && (
        <div className={`alert-toast ${toast.type === "success" ? "alert-success" : "alert-error"}`}>
          {toast.type === "error" && <AlertCircle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

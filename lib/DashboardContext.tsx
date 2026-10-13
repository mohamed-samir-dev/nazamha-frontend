"use client";

import { createContext, useContext } from "react";
import { Grade, Group, Student, MonthlySubscription } from "@/lib/types";

export interface DashboardData {
  totals?: { totalStudents: number; paid: number; due: number };
  teacher: any;
  grades: Grade[];
  groups: Group[];
  students: Student[];
  subscriptions: MonthlySubscription[];
  attendance: any[];
  totalBooksDelivered?: number;
}

interface DashboardContextValue {
  data: DashboardData | null;
  loading: boolean;
  refresh: (force?: boolean) => Promise<DashboardData>;
  updatedAt: number;
}

export const DashboardContext = createContext<DashboardContextValue>({ data: null, loading: true, refresh: async () => { throw new Error("Dashboard provider missing"); }, updatedAt: 0 });

export function useDashboard(): DashboardContextValue {
  return useContext(DashboardContext);
}

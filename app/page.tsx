"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/services/authService";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const user = await AuthService.getUser();
      if (user) {
        router.replace("/teacher");
      } else {
        router.replace("/teacher/login");
      }
    }
    checkAuth();
  }, [router]);

  return (
    <div className="loading-wrapper">
      <div className="spinner"></div>
    </div>
  );
}

import { api } from "@/lib/apiClient";

export interface SystemSettings {
  id?: number;
  site_name: string;
  sidebar_name?: string;
  site_logo: string;
  site_favicon?: string;
  hide_sidebar_name?: boolean;
  maintenance_mode?: boolean;
  maintenance_message?: string;
  welcome_message?: string;
  welcome_message_enabled?: boolean;
  qr_header_type?: "image" | "teacher";
}

export const SystemSettingsService = {
  async getSettings(): Promise<SystemSettings | null> {
    const data = await api.get<SystemSettings>("/settings").catch(() => null);
    if (!data) return null;

    const settings: SystemSettings = { ...data, hide_sidebar_name: false };

    if (settings.site_name?.startsWith("[HIDDEN]")) {
      settings.hide_sidebar_name = true;
      settings.site_name = settings.site_name.replace("[HIDDEN]", "");
    }

    if (settings.site_name?.includes("|||SIDEBAR|||")) {
      const parts = settings.site_name.split("|||SIDEBAR|||");
      settings.site_name = parts[0];
      settings.sidebar_name = parts[1];
    } else {
      settings.sidebar_name = settings.site_name;
    }

    if (settings.site_logo?.includes("|||FAVICON|||")) {
      const parts = settings.site_logo.split("|||FAVICON|||");
      settings.site_logo = parts[0];
      settings.site_favicon = parts[1];
    }

    return settings;
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<void> {
    let finalSiteName = settings.site_name || "إدارة السناتر والمعلمين";
    if (settings.sidebar_name && settings.sidebar_name !== settings.site_name) {
      finalSiteName += "|||SIDEBAR|||" + settings.sidebar_name;
    }
    if (settings.hide_sidebar_name) {
      finalSiteName = "[HIDDEN]" + finalSiteName;
    }

    let finalSiteLogo = settings.site_logo || "";
    if (settings.site_favicon) {
      finalSiteLogo += "|||FAVICON|||" + settings.site_favicon;
    }

    await api.patch("/settings", {
      site_name: finalSiteName,
      site_logo: finalSiteLogo,
      maintenance_mode: settings.maintenance_mode ?? false,
      maintenance_message: settings.maintenance_message || "",
      welcome_message: settings.welcome_message || "",
      welcome_message_enabled: settings.welcome_message_enabled ?? false,
      qr_header_type: settings.qr_header_type ?? "teacher",
    });
  },
};

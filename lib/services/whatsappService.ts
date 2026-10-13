import { api } from "@/lib/apiClient";

export const WhatsAppService = {
  getStatus: () => api.get<{ status: string; hasQR: boolean }>("/whatsapp/status"),
  getQR: () => api.get<{ qr: string }>("/whatsapp/qr"),
  connect: () => api.post("/whatsapp/connect", {}),
  disconnect: () => api.post("/whatsapp/disconnect", {}),
  send: (phone: string, message: string) =>
    api.post<{ success: boolean }>("/whatsapp/send", { phone, message }),
  sendImage: (phone: string, imageBase64: string, caption: string) =>
    api.post<{ success: boolean }>("/whatsapp/send-image", { phone, imageBase64, caption }),
};

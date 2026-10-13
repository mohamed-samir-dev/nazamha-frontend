export function getAuditLabel(action: string, newData?: Record<string, any>): string {
  const name = newData?.name || newData?.teacher_name || "";
  switch (action) {
    case "teacher.create": return `تم إضافة مدرس${name ? ` "${name}"` : ""}`;
    case "teacher.update": return `تم تعديل بيانات مدرس${name ? ` "${name}"` : ""}`;
    case "teacher.deactivate": return `تم تعطيل مدرس${name ? ` "${name}"` : ""}`;
    case "teacher.activate": return `تم تفعيل مدرس${name ? ` "${name}"` : ""}`;
    case "teacher.delete": return `تم حذف مدرس${name ? ` "${name}"` : ""}`;
    case "center.staff.create": return `تم إضافة مساعد${name ? ` "${name}"` : ""}`;
    case "center.staff.update": return `تم تعديل مساعد${name ? ` "${name}"` : ""}`;
    case "center.staff.deactivate": return `تم تعطيل مساعد${name ? ` "${name}"` : ""}`;
    case "center.staff.transfer": return `تم نقل مساعد${newData?.teacher_name ? ` إلى "${newData.teacher_name}"` : " إلى مدرس آخر"}`;
    case "center.room.create": return `تم إضافة القاعة${name ? ` "${name}"` : ""}`;
    case "center.room.update": return `تم تعديل القاعة${name ? ` "${name}"` : ""}`;
    case "center.room.activate": return `تم تفعيل القاعة${name ? ` "${name}"` : ""}`;
    case "center.room.deactivate": return `تم تعطيل القاعة${name ? ` "${name}"` : ""}`;
    case "center.room.delete": return `تم حذف القاعة${name ? ` "${name}"` : ""}`;
    case "center.update": return "تم تحديث بيانات السنتر";
    default: return action;
  }
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  return new Date(dateStr).toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
}

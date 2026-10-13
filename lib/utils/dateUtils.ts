/**
 * Date utilities that use Africa/Cairo timezone consistently
 * Use these instead of new Date().toISOString() to avoid timezone bugs
 */

const CAIRO_TZ = "Africa/Cairo";

/**
 * Get today's date in Cairo timezone (YYYY-MM-DD format)
 */
export function getTodayCairo(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: CAIRO_TZ });
}

/**
 * Get current time in Cairo timezone (HH:MM format)
 */
export function getTimeCairo(): string {
  return new Date().toLocaleTimeString("en-US", { 
    timeZone: CAIRO_TZ, 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: false 
  });
}

/**
 * Get current Date object adjusted to Cairo timezone
 */
export function getDateCairo(): Date {
  const cairoDateStr = new Date().toLocaleString("en-US", { timeZone: CAIRO_TZ });
  return new Date(cairoDateStr);
}

/**
 * Get day of week in Cairo timezone (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeekCairo(): number {
  return getDateCairo().getDay();
}

/**
 * Get current year in Cairo timezone
 */
export function getYearCairo(): number {
  return getDateCairo().getFullYear();
}

/**
 * Get current month in Cairo timezone (1-12)
 */
export function getMonthCairo(): number {
  return getDateCairo().getMonth() + 1;
}

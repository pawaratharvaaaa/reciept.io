/**
 * Reciept.io Pocket Thermal & POS Printing Engine
 * Supports handheld Bluetooth/USB mini pocket printers (58mm / 2-inch)
 * and supermarket counter POS printers (80mm / 3-inch)
 */

export type ThermalPaperWidth = "58mm" | "80mm" | "standard";

export interface PrinterPreferences {
  paperWidth: ThermalPaperWidth;
  autoPrintOnSave: boolean;
  soundNotification: boolean;
}

const STORAGE_KEY = "reciept_io_printer_preferences";

export const ThermalPrinterEngine = {
  getPreferences(): PrinterPreferences {
    if (typeof window === "undefined") {
      return { paperWidth: "58mm", autoPrintOnSave: false, soundNotification: true };
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return { paperWidth: "58mm", autoPrintOnSave: false, soundNotification: true };
  },

  savePreferences(prefs: PrinterPreferences): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  },

  /**
   * Applies thermal printing stylesheet attributes to the document before invoking window.print().
   */
  prepareAndPrint(paperWidth: ThermalPaperWidth = "58mm"): void {
    if (typeof window === "undefined") return;

    // Set a data attribute on document body so CSS applies exact pocket printer dimensions
    document.body.setAttribute("data-thermal-print", paperWidth);

    // Beep / haptic feedback if available (common in retail handheld machines)
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(80);
    }

    setTimeout(() => {
      window.print();
      // Reset after print dialog closes
      setTimeout(() => {
        document.body.removeAttribute("data-thermal-print");
      }, 1000);
    }, 150);
  },
};

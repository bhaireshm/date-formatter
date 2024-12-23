export interface DateFormatI18n {
  dayNames: string[];
  monthNames: string[];
  timeNames: string[];
  suffixes: string[];
}

export interface DateFormatOptions {
  // mask?: string;
  utc?: boolean;
  gmt?: boolean;
  timezoneOffset?: number;
}

export class DateFormatter extends Date {
  static readonly i18n: DateFormatI18n = {
    dayNames: [
      "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
      "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
    ],
    monthNames: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
    ],
    timeNames: ["a", "p", "am", "pm", "A", "P", "AM", "PM"],
    suffixes: ["th", "st", "nd", "rd"], // Localizable suffixes
  };

  static readonly masks: Record<string, string> = {
    default: "ddd MMM dd yyyy HH:mm:ss",
    shortDate: "m/d/yy",
    longDate: "dddd, MMMM d, yyyy",
    isoDate: "yyyy-MM-dd",
    isoTime: "HH:mm:ss",
    isoDateTime: "yyyy-MM-dd'T'HH:mm:ss",
    isoUtcDateTime: "UTC:yyyy-MM-dd'T'HH:mm:ss'Z'",
  };

  constructor(date?: string | number | Date) {
    super(date || new Date());
    if (isNaN(this.getTime())) throw new Error("Invalid date");
  }

  private static pad(val: number, len = 2): string {
    return String(val).padStart(len, "0");
  }

  private static getSuffix(day: number): string {
    const { suffixes } = DateFormatter.i18n;
    return day % 10 > 3 || (day % 100 >= 11 && day % 100 <= 13) ? suffixes[0] : suffixes[day % 10];
  }

  format(mask: string = DateFormatter.masks.default, options: DateFormatOptions = {}): string {
    const { utc = false, gmt = false, timezoneOffset } = options;

    let date: Date = this;

    // Apply timezone offset if provided
    if (timezoneOffset !== undefined) {
      // TODO: Check timezone
      date = new Date(this.getTime() + (timezoneOffset * 60 * 1000));
    }

    const getMethod = (method: string): (() => number) => {
      const methodName = `${utc ? "getUTC" : "get"}${method}`;
      return date[methodName as keyof Date].bind(date) as (() => number);
    };

    const d = getMethod("Date")();
    const D = getMethod("Day")();

    // h - for hour (12-hour clock), H - for hour (24-hour clock)
    const H = getMethod("Hours")();

    // a/A - for AM/PM

    // m - without leading zero, mm - with leading zero
    const m = getMethod("Minutes")();

    // s - without leading zero, ss - with leading zero
    const s = getMethod("Seconds")();

    // S - without leading zero, SS - with leading zero, SSS - with milliseconds
    const L = getMethod("Milliseconds")();

    const M = getMethod("Month")();
    const y = getMethod("FullYear")();

    const flags: Record<string, () => string> = {
      // a: () => (H < 12 ? DateFormatter.i18n.timeNames[0] : DateFormatter.i18n.timeNames[1]),
      d: () => String(d),
      dd: () => DateFormatter.pad(d),
      ddd: () => DateFormatter.i18n.dayNames[D],
      dddd: () => DateFormatter.i18n.dayNames[D + 7],
      M: () => String(M + 1),
      MM: () => DateFormatter.pad(M + 1),
      MMM: () => DateFormatter.i18n.monthNames[M],
      MMMM: () => DateFormatter.i18n.monthNames[M + 12],
      yy: () => String(y).slice(2),
      yyyy: () => String(y),
      h: () => String(H % 12 || 12),
      hh: () => DateFormatter.pad(H % 12 || 12),
      H: () => String(H),
      HH: () => DateFormatter.pad(H),
      m: () => String(m),
      mm: () => DateFormatter.pad(m),
      s: () => String(s),
      ss: () => DateFormatter.pad(s),
      l: () => DateFormatter.pad(L, 3),

      t: () => (H < 12 ? DateFormatter.i18n.timeNames[0] : DateFormatter.i18n.timeNames[1]),
      tt: () => (H < 12 ? DateFormatter.i18n.timeNames[2] : DateFormatter.i18n.timeNames[3]),
      T: () => (H < 12 ? DateFormatter.i18n.timeNames[4] : DateFormatter.i18n.timeNames[5]),
      TT: () => (H < 12 ? DateFormatter.i18n.timeNames[6] : DateFormatter.i18n.timeNames[7]),

      S: () => DateFormatter.getSuffix(d),
      Z: () => (gmt ? "GMT" : utc ? "UTC" : ""),
    };

    return mask.replace(/d{1,4}|M{1,4}|m{1,2}|yy(?:yy)?|([HhMsTt])\1?|S|Z|"[^"]*"|'[^']*'/g, (match) => {
      return match in flags ? flags[match]() : match.slice(1, match.length - 1);
    }
    );
  }
}

export default DateFormatter;

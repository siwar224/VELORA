type Schedule = Record<number, readonly [string, string] | null>;

export type OpenStatus =
  | { open: true; closes: string }
  | { open: false; opensDay: number | null; opensAt: string }; // opensDay null = later today

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Weekday (0 = Sunday) and minutes since midnight of `date` in `timeZone`. */
export function zonedNow(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

/** Is the shop open at `date` (in the shop's time zone), and if not, when does it open next? */
export function openStatus(schedule: Schedule, timeZone: string, date = new Date()): OpenStatus {
  const { day, minutes } = zonedNow(date, timeZone);
  const today = schedule[day];

  if (today && minutes >= toMin(today[0]) && minutes < toMin(today[1])) {
    return { open: true, closes: today[1] };
  }
  if (today && minutes < toMin(today[0])) {
    return { open: false, opensDay: null, opensAt: today[0] };
  }
  // Next day with hours (up to a week ahead).
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const hours = schedule[d];
    if (hours) return { open: false, opensDay: d, opensAt: hours[0] };
  }
  return { open: false, opensDay: null, opensAt: "" };
}

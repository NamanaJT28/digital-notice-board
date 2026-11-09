export const CATEGORIES = [
  { name: "Cultural Events", icon: "🎭" },
  { name: "Internals", icon: "📝" },
  { name: "Examinations & Results", icon: "🎓" },
  { name: "Placements", icon: "💼" },
  { name: "Club Activities", icon: "🤝" },
  { name: "General Notices", icon: "📢" },
];

export const iconFor = (cat) => CATEGORIES.find((c) => c.name === cat)?.icon || "📌";

export const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

// Days left until end of the expiry day, computed from real dates
export function daysLeft(expiry) {
  const end = new Date(expiry);
  end.setHours(23, 59, 59, 999);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (end < new Date()) return -1;
  return Math.round((new Date(end).setHours(0, 0, 0, 0) - today) / 86400000);
}

export function expiryLabel(expiry) {
  const d = daysLeft(expiry);
  if (d < 0) return "Expired";
  if (d === 0) return "Expires today";
  return `${d} day${d === 1 ? "" : "s"} left`;
}

// active | upcoming | expired | inactive
export function statusOf(n) {
  if (n.isActive === false) return "inactive";
  if (daysLeft(n.expiryDate) < 0) return "expired";
  if (new Date(n.publishDate) > new Date()) return "upcoming";
  return "active";
}

export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export const fmtSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

import { Timestamp, db, doc, getDoc } from "./firebase-config.js";

export const INPUT_POLICY_PATH = ["settings", "input_policy"];

export const CLOSED_POLICY = {
  cleanupEnabled: false,
  cleanupStartAt: null,
  cleanupEndAt: null,
  cleanupMessage: "現在、清掃活動の入力受付期間外です。",
  natureEnabled: false,
  natureStartAt: null,
  natureEndAt: null,
  natureMessage: "現在、自然観察の入力受付期間外です。",
};

export async function loadInputPolicy() {
  const snapshot = await getDoc(doc(db, ...INPUT_POLICY_PATH));
  return snapshot.exists() ? { ...CLOSED_POLICY, ...snapshot.data() } : CLOSED_POLICY;
}

export function isInputOpen(policy, type, now = new Date()) {
  const prefix = type === "nature" ? "nature" : "cleanup";
  const start = toDate(policy?.[`${prefix}StartAt`]);
  const end = toDate(policy?.[`${prefix}EndAt`]);
  return Boolean(policy?.[`${prefix}Enabled`] && start && end && start <= now && now <= end);
}

export function getInputMessage(policy, type) {
  const prefix = type === "nature" ? "nature" : "cleanup";
  return policy?.[`${prefix}Message`] ||
    (type === "nature"
      ? CLOSED_POLICY.natureMessage
      : CLOSED_POLICY.cleanupMessage);
}

export function toDate(value) {
  if (value instanceof Date) {
    return value;
  }
  return value?.toDate ? value.toDate() : null;
}

export function toTimestamp(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : Timestamp.fromDate(date);
}

export function formatInputDateTime(value) {
  const date = toDate(value);
  if (!date) {
    return "未設定";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function toDateTimeLocalValue(value) {
  const date = toDate(value);
  if (!date) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export const BFF_SHEET_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTiI1mMxBk1XrKofOyqX4F6eCzOCxgdwguJ2sfSl2zXcpQRG6fWNlbwkH-9bPPJk6O9byx5ygxGLxFO/pub?gid=1549021748&single=true&output=csv";

const PACIFIC = "America/Los_Angeles";

export interface BffSheet {
    submissions: number | null;
    deadline: number;
    drawing: string;
}

function parseSheet(csv: string): Record<string, string> {
    const stats: Record<string, string> = {};
    const lines = csv.trim().split(/\r?\n/).slice(1);
    for (const line of lines) {
        const splitAt = line.indexOf(",");
        if (splitAt === -1) continue;
        const key = line.slice(0, splitAt).trim();
        let value = line.slice(splitAt + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (key) stats[key] = value;
    }
    return stats;
}

export async function fetchBffSheet(url = BFF_SHEET_URL): Promise<BffSheet> {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(String(response.status));
    const stats = parseSheet(await response.text());

    const deadline = Date.parse(stats["Submission Deadline"] || stats["Submission Deadline UTC"] || "");
    if (!Number.isFinite(deadline)) throw new Error("deadline");

    const total = Number(stats["Total Submissions"]);
    return {
        submissions: Number.isFinite(total) ? total : null,
        deadline,
        drawing: formatDrawingDate(stats["Drawing Date"] ?? ""),
    };
}

export function submissionsLabel(count: number): string {
    return count === 1 ? "submission" : "submissions";
}

export function formatDeadline(ms: number): string {
    const when = new Date(ms);
    const date = new Intl.DateTimeFormat("en-US", {
        timeZone: PACIFIC,
        weekday: "long",
        month: "long",
        day: "numeric",
    }).format(when);
    const time = new Intl.DateTimeFormat("en-US", {
        timeZone: PACIFIC,
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    }).format(when);
    return `${date} at ${time}`;
}

export function formatDeadlineCompact(ms: number): string {
    return new Intl.DateTimeFormat("en-US", {
        timeZone: PACIFIC,
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    }).format(new Date(ms));
}

export function formatDrawingDate(isoDate: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
    if (!match) return isoDate;
    const [, year, month, day] = match;
    return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(new Date(Number(year), Number(month) - 1, Number(day)));
}

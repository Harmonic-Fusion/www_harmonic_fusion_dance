import { initNav } from "../lib/nav.ts";

initNav();

const PACIFIC = "America/Los_Angeles";

const live = document.querySelector<HTMLElement>(".bff-live");
const countdown = document.querySelector<HTMLElement>(".bff-countdown");
const countdownLabel = countdown?.querySelector<HTMLElement>(".bff-countdown-label");
const submissionsValue = document.querySelector<HTMLElement>('[data-stat="submissions"]');
const submissionsLabel = document.querySelector<HTMLElement>('[data-stat="submissions-label"]');
const drawingValue = document.querySelector<HTMLElement>('[data-stat="drawing"]');

if (live && countdown && countdownLabel) {
    const sheetUrl = live.dataset.sheetUrl ?? "";
    const units = {
        days: countdown.querySelector<HTMLElement>('[data-unit="days"]'),
        hours: countdown.querySelector<HTMLElement>('[data-unit="hours"]'),
        minutes: countdown.querySelector<HTMLElement>('[data-unit="minutes"]'),
        seconds: countdown.querySelector<HTMLElement>('[data-unit="seconds"]'),
    };

    let deadline = Number.NaN;
    const pad = (value: number) => String(value).padStart(2, "0");

    const tick = () => {
        if (!Number.isFinite(deadline)) return;
        const remaining = deadline - Date.now();
        if (remaining <= 0) {
            countdown.classList.add("is-closed");
            countdown.setAttribute("aria-live", "polite");
            return;
        }

        countdown.classList.remove("is-closed");
        const totalSeconds = Math.floor(remaining / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (units.days) units.days.textContent = String(days);
        if (units.hours) units.hours.textContent = pad(hours);
        if (units.minutes) units.minutes.textContent = pad(minutes);
        if (units.seconds) units.seconds.textContent = pad(seconds);
    };

    const loadSheet = async () => {
        const response = await fetch(sheetUrl, { cache: "no-store" });
        if (!response.ok) throw new Error(String(response.status));
        const stats = parseSheet(await response.text());

        const deadlineValue = stats["Submission Deadline"] || stats["Submission Deadline UTC"];
        const parsedDeadline = Date.parse(deadlineValue ?? "");
        if (!Number.isFinite(parsedDeadline)) throw new Error("deadline");
        deadline = parsedDeadline;
        countdownLabel.textContent = `Entries close ${formatDeadline(deadline)}`;

        const total = Number(stats["Total Submissions"]);
        if (submissionsValue && submissionsLabel && Number.isFinite(total)) {
            submissionsValue.textContent = total.toLocaleString("en-US");
            submissionsLabel.textContent = total === 1 ? "submission" : "submissions";
        }

        const drawing = stats["Drawing Date"];
        if (drawingValue && drawing) drawingValue.textContent = formatDrawingDate(drawing);

        tick();
    };

    window.setInterval(tick, 1000);

    loadSheet().catch(() => {
        countdownLabel.textContent = "Couldn't load the entry deadline.";
    });
    window.setInterval(() => {
        loadSheet().catch(() => {});
    }, 60_000);
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

function formatDeadline(ms: number): string {
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

function formatDrawingDate(isoDate: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
    if (!match) return isoDate;
    const [, year, month, day] = match;
    return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(new Date(Number(year), Number(month) - 1, Number(day)));
}

const share = document.querySelector<HTMLElement>(".bff-share");
const copyButton = document.querySelector<HTMLButtonElement>("#bff-copy");
const shareButton = document.querySelector<HTMLButtonElement>("#bff-share");
const status = document.querySelector<HTMLElement>("#bff-share-status");

if (share && copyButton && status) {
    const url = share.dataset.shareUrl ?? "";
    const text = share.dataset.shareText ?? "";

    copyButton.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(url);
            status.textContent = "Link copied.";
        } catch {
            status.textContent = "Couldn't copy. Select the link and copy it manually.";
        }
    });

    if (shareButton && typeof navigator.share === "function") {
        shareButton.hidden = false;
        shareButton.addEventListener("click", async () => {
            try {
                await navigator.share({ title: "BFF Pass Giveaway", text, url });
                status.textContent = "";
            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") return;
                status.textContent = "Couldn't open the share sheet.";
            }
        });
    }
}

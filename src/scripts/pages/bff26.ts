import { fetchBffSheet, formatDeadline, submissionsLabel } from "../lib/bff.ts";
import { initNav } from "../lib/nav.ts";

initNav();

const live = document.querySelector<HTMLElement>(".bff-live");
const countdown = document.querySelector<HTMLElement>(".bff-countdown");
const countdownLabel = countdown?.querySelector<HTMLElement>(".bff-countdown-label");
const submissionsValue = document.querySelector<HTMLElement>('[data-stat="submissions"]');
const submissionsName = document.querySelector<HTMLElement>('[data-stat="submissions-label"]');
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
        const sheet = await fetchBffSheet(sheetUrl);
        deadline = sheet.deadline;
        countdownLabel.textContent = `Entries close ${formatDeadline(deadline)}`;

        if (submissionsValue && submissionsName && sheet.submissions !== null) {
            submissionsValue.textContent = sheet.submissions.toLocaleString("en-US");
            submissionsName.textContent = submissionsLabel(sheet.submissions);
        }

        if (drawingValue && sheet.drawing) drawingValue.textContent = sheet.drawing;

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

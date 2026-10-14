// Calendar event model and the event details dialog shared by the home and calendar pages.
import { SITE_CONFIG } from "./config.ts";
import { escapeHtml } from "./dom.ts";
import { renderEventDescription } from "./event-description.ts";

export const CALENDAR_ID = SITE_CONFIG.calendarId;
export const API_KEY = SITE_CONFIG.googleCalendarApiKey || "";

export interface CalendarEvent {
    id: string | null;
    summary: string;
    description: string;
    location: string;
    start: Date | null;
    end: Date | null;
}

/** An event from the Google Calendar API v3 events list. */
export interface ApiEventItem {
    id?: string;
    summary?: string;
    description?: string;
    location?: string;
    start: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
}

export interface ApiEventList {
    items?: ApiEventItem[];
}

const PACIFIC = "America/Los_Angeles";

// Decode iCal escape sequences: \, \; \\ and \n or \N.
export function decodeICalText(text: string): string {
    if (!text) return text;
    return text
        .replace(/\\,/g, ",")
        .replace(/\;/g, ";")
        .replace(/\\\\/g, "\\")
        .replace(/\\[nN]/g, "\n");
}

export function createMapsUrl(location: string): string | null {
    if (!location || location === "Location TBD") return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

// Dates and times are shown in Pacific time to avoid offset issues for visitors elsewhere.
export function formatEventDate(date: Date | null): string {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: PACIFIC,
    });
}

export function formatEventTime(start: Date | null, end: Date | null): string {
    if (!start) return "";
    const timeOptions: Intl.DateTimeFormatOptions = {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: PACIFIC,
    };
    const startTime = start.toLocaleTimeString("en-US", timeOptions);
    if (end) {
        return `${startTime} - ${end.toLocaleTimeString("en-US", timeOptions)}`;
    }
    return startTime;
}

export function eventShareUrl(event: CalendarEvent): string | null {
    if (!event || !event.id) return null;
    return `/calendar/${encodeURIComponent(event.id)}`;
}

/** Fills a location element, linking to Google Maps when there is a real address. */
export function renderLocation(locationEl: HTMLElement, location: string): void {
    const locationStr = decodeICalText(location) || "Location TBD";
    const mapsUrl = createMapsUrl(locationStr);
    if (mapsUrl) {
        locationEl.innerHTML = `<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="location-link">${escapeHtml(locationStr)}</a>`;
    } else {
        locationEl.textContent = locationStr;
    }
}

export function showEventModal(event: CalendarEvent): void {
    const eventModal = document.getElementById("event-modal") as HTMLDialogElement | null;
    if (!eventModal) return;

    document.getElementById("modal-title")!.textContent = event.summary || "Untitled Event";
    document.getElementById("modal-time")!.textContent =
        formatEventTime(event.start, event.end) + (event.start ? ` (${formatEventDate(event.start)})` : "");

    renderLocation(document.getElementById("modal-location")!, event.location);

    const description = event.description || "No description available.";
    // Clean and render HTML/markdown content (description comes from Google Calendar)
    document.getElementById("modal-description")!.innerHTML = renderEventDescription(description);

    const viewLink = document.getElementById("modal-view-event") as HTMLAnchorElement | null;
    const viewWrap = viewLink ? viewLink.closest<HTMLElement>(".modal-view-event-wrap") : null;
    const shareUrl = eventShareUrl(event);
    if (viewLink && shareUrl) {
        viewLink.href = shareUrl;
        if (viewWrap) viewWrap.hidden = false;
    } else if (viewWrap) {
        viewWrap.hidden = true;
    }

    eventModal.showModal();
}

/** Close the dialog from its close button or a click on the backdrop. */
export function setupEventModal(): void {
    const eventModal = document.getElementById("event-modal") as HTMLDialogElement | null;
    if (!eventModal) return;

    document.getElementById("modal-close")?.addEventListener("click", () => eventModal.close());

    eventModal.addEventListener("click", (e) => {
        if (e.target === eventModal) {
            eventModal.close();
        }
    });
}

// Google Calendar recurring instance ids look like "{baseId}_{YYYYMMDDTHHMMSSZ}".
export function instanceStamp(start: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
        start.getUTCFullYear() +
        pad(start.getUTCMonth() + 1) +
        pad(start.getUTCDate()) +
        "T" +
        pad(start.getUTCHours()) +
        pad(start.getUTCMinutes()) +
        pad(start.getUTCSeconds()) +
        "Z"
    );
}

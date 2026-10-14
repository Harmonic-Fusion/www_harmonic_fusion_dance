import { initCarousel } from "../lib/carousel.ts";
import { escapeHtml, onReady } from "../lib/dom.ts";
import {
    API_KEY,
    CALENDAR_ID,
    type ApiEventList,
    type CalendarEvent,
    setupEventModal,
    showEventModal,
} from "../lib/events.ts";
import { initNav } from "../lib/nav.ts";

initNav();
initCarousel();

// Next upcoming events for the home page
type UpcomingEvent = CalendarEvent & { start: Date };

const LIMIT = 3;
const PACIFIC = "America/Los_Angeles";

const listEl = document.getElementById("upcoming-events-list");
const loadingEl = document.getElementById("upcoming-events-loading");

let eventsCache: UpcomingEvent[] = [];

function formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: PACIFIC,
    });
}

function formatTime(start: Date, end: Date | null): string {
    const opts: Intl.DateTimeFormatOptions = {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: PACIFIC,
    };
    const startStr = start.toLocaleTimeString("en-US", opts);
    if (!end) return startStr;
    return `${startStr} – ${end.toLocaleTimeString("en-US", opts)}`;
}

function renderEvents(list: HTMLElement, items: UpcomingEvent[]) {
    eventsCache = items;

    if (!items.length) {
        list.innerHTML = '<li class="upcoming-empty">No upcoming events right now.</li>';
        return;
    }

    list.innerHTML = items
        .map((item, index) => {
            const title = escapeHtml(item.summary || "Untitled event");
            const location = item.location ? escapeHtml(item.location) : "";
            return `
                <li>
                    <button type="button" class="upcoming-item" data-event-index="${index}" aria-haspopup="dialog">
                        <span class="upcoming-item-body">
                            <span class="upcoming-title">${title}</span>
                            <span class="upcoming-meta">${formatDate(item.start)} · ${formatTime(item.start, item.end)}</span>
                            ${location ? `<span class="upcoming-location">${location}</span>` : ""}
                        </span>
                        <span class="upcoming-item-affordance" aria-hidden="true">Details →</span>
                    </button>
                </li>
            `;
        })
        .join("");
}

async function loadFromApi(): Promise<UpcomingEvent[]> {
    const now = new Date();
    const later = new Date(now);
    later.setDate(later.getDate() + 90);

    const encodedId = encodeURIComponent(CALENDAR_ID);
    const url =
        `https://www.googleapis.com/calendar/v3/calendars/${encodedId}/events` +
        `?key=${API_KEY}` +
        `&singleEvents=true` +
        `&orderBy=startTime` +
        `&maxResults=${LIMIT}` +
        `&timeMin=${encodeURIComponent(now.toISOString())}` +
        `&timeMax=${encodeURIComponent(later.toISOString())}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data: ApiEventList = await res.json();
    return (data.items || []).map((item) => ({
        id: item.id || null,
        summary: item.summary || "",
        description: item.description || "",
        location: item.location || "",
        start: item.start.dateTime ? new Date(item.start.dateTime) : new Date(item.start.date + "T12:00:00"),
        end: item.end?.dateTime
            ? new Date(item.end.dateTime)
            : item.end?.date
              ? new Date(item.end.date + "T12:00:00")
              : null,
    }));
}

function unfoldIcal(text: string): string {
    return text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

function parseIcalDate(value: string): Date | null {
    if (!value) return null;
    if (value.length === 8) {
        const y = +value.slice(0, 4);
        const m = +value.slice(4, 6) - 1;
        const d = +value.slice(6, 8);
        return new Date(y, m, d, 12, 0, 0);
    }
    const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
    if (!m) return new Date(value);
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
}

function parseIcalEvents(icalText: string): UpcomingEvent[] {
    const text = unfoldIcal(icalText);
    const blocks = text.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
    const now = new Date();
    const events: UpcomingEvent[] = [];

    for (const block of blocks) {
        const get = (key: string) => {
            const re = new RegExp(`^${key}(?:;[^:]*)?:(.*)$`, "mi");
            const match = block.match(re);
            return match ? match[1].trim() : "";
        };

        const start = parseIcalDate(get("DTSTART"));
        if (!start || start < now) continue;

        const uid = get("UID").replace(/@google\.com$/i, "");
        events.push({
            id: uid || null,
            summary: get("SUMMARY").replace(/\\,/g, ",").replace(/\\n/gi, " "),
            description: get("DESCRIPTION").replace(/\\,/g, ",").replace(/\\n/gi, "\n"),
            location: get("LOCATION").replace(/\\,/g, ","),
            start,
            end: parseIcalDate(get("DTEND")),
        });
    }

    events.sort((a, b) => a.start.getTime() - b.start.getTime());
    return events.slice(0, LIMIT);
}

async function loadFromIcal(): Promise<UpcomingEvent[]> {
    const calendarUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;
    const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(calendarUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(calendarUrl)}`,
    ];

    try {
        const direct = await fetch(calendarUrl);
        if (direct.ok) {
            const text = await direct.text();
            if (text.includes("BEGIN:VCALENDAR")) return parseIcalEvents(text);
        }
    } catch {
        /* try proxies */
    }

    for (const proxyUrl of proxies) {
        try {
            const res = await fetch(proxyUrl);
            if (!res.ok) continue;
            const text = await res.text();
            if (text && text.includes("BEGIN:VCALENDAR")) return parseIcalEvents(text);
        } catch {
            /* next */
        }
    }

    throw new Error("iCal fetch failed");
}

async function loadUpcoming(list: HTMLElement) {
    if (loadingEl) loadingEl.hidden = false;

    try {
        let items: UpcomingEvent[];
        try {
            items = await loadFromApi();
        } catch (apiErr) {
            console.warn("Calendar API failed, trying iCal fallback", apiErr);
            items = await loadFromIcal();
        }
        renderEvents(list, items);
    } catch (err) {
        console.error(err);
        list.innerHTML = '<li class="upcoming-empty">Unable to load events. <a href="/calendar/">View calendar</a></li>';
    } finally {
        if (loadingEl) loadingEl.hidden = true;
    }
}

if (listEl) {
    listEl.addEventListener("click", (e) => {
        const button = (e.target as Element).closest(".upcoming-item");
        if (!button) return;
        const index = Number(button.getAttribute("data-event-index"));
        const event = eventsCache[index];
        if (event) showEventModal(event);
    });

    setupEventModal();
    onReady(() => loadUpcoming(listEl));
}

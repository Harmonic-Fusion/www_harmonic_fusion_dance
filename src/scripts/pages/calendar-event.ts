// Shareable single-event page at /calendar/{eventId}
import { onReady, requireElement } from "../lib/dom.ts";
import { renderEventDescription } from "../lib/event-description.ts";
import {
    API_KEY,
    CALENDAR_ID,
    type ApiEventItem,
    type ApiEventList,
    type CalendarEvent,
    formatEventDate,
    formatEventTime,
    instanceStamp,
    renderLocation,
} from "../lib/events.ts";
import { initNav } from "../lib/nav.ts";

initNav();

interface FeedEvent extends CalendarEvent {
    instanceId: string | null;
}

const loadingState = requireElement("loading-state");
const errorState = requireElement("error-state");
const errorMessage = requireElement("error-message");
const eventContent = requireElement("event-content");
const copyLinkBtn = document.getElementById("copy-link");

function getEventId(): string | null {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const match = path.match(/^\/calendar\/([^/]+)$/);
    if (match) {
        const segment = decodeURIComponent(match[1]);
        if (segment && segment !== "event.html" && !segment.includes(".")) {
            return segment;
        }
    }
    return new URLSearchParams(window.location.search).get("id");
}

function showError(message: string) {
    loadingState.classList.remove("active");
    eventContent.hidden = true;
    errorState.hidden = false;
    errorMessage.textContent = message;
}

function renderEvent(event: CalendarEvent) {
    requireElement("event-title").textContent = event.summary || "Untitled Event";
    document.title = `${event.summary || "Event"} | Harmonic Fusion`;

    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
        const plain = (event.description || "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        descMeta.setAttribute("content", plain.slice(0, 160) || `${event.summary || "Event"} — Harmonic Fusion`);
    }

    requireElement("event-time").textContent =
        formatEventTime(event.start, event.end) + (event.start ? ` (${formatEventDate(event.start)})` : "");

    renderLocation(requireElement("event-location"), event.location);

    const description = event.description || "No description available.";
    requireElement("event-description").innerHTML = renderEventDescription(description);

    loadingState.classList.remove("active");
    errorState.hidden = true;
    eventContent.hidden = false;
}

function mapApiItem(item: ApiEventItem): CalendarEvent {
    return {
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
    };
}

function listByICalUidUrl(uid: string): string {
    return (
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events` +
        `?key=${API_KEY}` +
        `&iCalUID=${encodeURIComponent(uid)}` +
        `&singleEvents=true` +
        `&maxResults=1` +
        `&orderBy=startTime`
    );
}

async function loadFromApi(eventId: string): Promise<CalendarEvent> {
    const url =
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${encodeURIComponent(eventId)}` +
        `?key=${API_KEY}`;

    const res = await fetch(url);
    if (res.ok) {
        return mapApiItem(await res.json());
    }

    // Recurring master / iCal UID fallback: list by iCalUID
    const listRes = await fetch(listByICalUidUrl(eventId));
    if (!listRes.ok) {
        throw new Error(`API ${res.status}`);
    }
    const data: ApiEventList = await listRes.json();
    if (data.items && data.items.length) {
        return mapApiItem(data.items[0]);
    }

    // Also try with @google.com suffix (common iCal UID form)
    if (!eventId.includes("@")) {
        const icalRes = await fetch(listByICalUidUrl(`${eventId}@google.com`));
        if (icalRes.ok) {
            const icalData: ApiEventList = await icalRes.json();
            if (icalData.items && icalData.items.length) {
                return mapApiItem(icalData.items[0]);
            }
        }
    }

    throw new Error("Event not found");
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
    if (m[7]) {
        return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
    }
    return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
}

function googleStyleInstanceId(uid: string, start: Date): string | null {
    const base = (uid || "").replace(/@google\.com$/i, "");
    if (!base || !start) return base || null;
    return `${base}_${instanceStamp(start)}`;
}

function parseIcalEvents(icalText: string): FeedEvent[] {
    const text = unfoldIcal(icalText);
    const blocks = text.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
    const events: FeedEvent[] = [];

    for (const block of blocks) {
        const get = (key: string) => {
            const re = new RegExp(`^${key}(?:;[^:]*)?:(.*)$`, "mi");
            const match = block.match(re);
            return match ? match[1].trim() : "";
        };

        const uid = get("UID");
        const start = parseIcalDate(get("DTSTART"));
        if (!start) continue;

        events.push({
            id: uid.replace(/@google\.com$/i, ""),
            instanceId: googleStyleInstanceId(uid, start),
            summary: get("SUMMARY").replace(/\\,/g, ",").replace(/\\n/gi, " "),
            description: get("DESCRIPTION").replace(/\\,/g, ",").replace(/\\n/gi, "\n"),
            location: get("LOCATION").replace(/\\,/g, ","),
            start,
            end: parseIcalDate(get("DTEND")),
        });
    }

    return events;
}

async function loadFromIcal(eventId: string): Promise<CalendarEvent> {
    const calendarUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;
    const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(calendarUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(calendarUrl)}`,
    ];

    let text: string | null = null;
    try {
        const direct = await fetch(calendarUrl);
        if (direct.ok) {
            const t = await direct.text();
            if (t.includes("BEGIN:VCALENDAR")) text = t;
        }
    } catch {
        /* try proxies */
    }

    if (!text) {
        for (const proxyUrl of proxies) {
            try {
                const res = await fetch(proxyUrl);
                if (!res.ok) continue;
                const t = await res.text();
                if (t && t.includes("BEGIN:VCALENDAR")) {
                    text = t;
                    break;
                }
            } catch {
                /* next */
            }
        }
    }

    if (!text) throw new Error("iCal fetch failed");

    const events = parseIcalEvents(text);
    const normalized = eventId.replace(/@google\.com$/i, "");
    const match =
        events.find((e) => e.instanceId === eventId || e.instanceId === normalized) ||
        events.find((e) => e.id === eventId || e.id === normalized);

    if (!match) throw new Error("Event not found");
    return match;
}

async function loadEvent() {
    const eventId = getEventId();
    if (!eventId) {
        showError("No event specified.");
        return;
    }

    try {
        let event: CalendarEvent;
        if (API_KEY) {
            try {
                event = await loadFromApi(eventId);
            } catch (apiErr) {
                console.warn("Event API failed, trying iCal fallback", apiErr);
                event = await loadFromIcal(eventId);
            }
        } else {
            event = await loadFromIcal(eventId);
        }
        renderEvent(event);
    } catch (err) {
        console.error(err);
        showError("This event could not be found or is no longer available.");
    }
}

if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", async () => {
        const url = window.location.href.split("?")[0];
        try {
            await navigator.clipboard.writeText(url);
            const original = copyLinkBtn.textContent;
            copyLinkBtn.textContent = "Copied!";
            setTimeout(() => {
                copyLinkBtn.textContent = original;
            }, 2000);
        } catch {
            copyLinkBtn.textContent = "Copy failed";
            setTimeout(() => {
                copyLinkBtn.textContent = "Copy Link";
            }, 2000);
        }
    });
}

onReady(loadEvent);

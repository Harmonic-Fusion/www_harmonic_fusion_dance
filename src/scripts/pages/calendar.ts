import { escapeHtml, requireElement } from "../lib/dom.ts";
import {
    API_KEY,
    CALENDAR_ID,
    type ApiEventList,
    type CalendarEvent,
    decodeICalText,
    instanceStamp,
    setupEventModal,
    showEventModal,
} from "../lib/events.ts";
import { initNav } from "../lib/nav.ts";

initNav();

interface ICalEvent extends CalendarEvent {
    rrule: string | null;
}

type TextProperty = "id" | "summary" | "description" | "location" | "rrule";

interface RRule {
    freq?: string;
    interval?: number;
    count?: number;
    until?: Date | null;
    byday?: string[];
}

// State
let allEvents: ICalEvent[] = [];
let filteredEvents: ICalEvent[] = [];

// DOM Elements
const monthSelector = requireElement<HTMLInputElement>("month-selector");
const startDateInput = requireElement<HTMLInputElement>("start-date");
const endDateInput = requireElement<HTMLInputElement>("end-date");
const loadingState = requireElement("loading-state");
const eventsContainer = requireElement("events-container");
const eventModal = requireElement<HTMLDialogElement>("event-modal");
const monthLabel = document.getElementById("month-label");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");

const RETRY_BUTTON = `
    <button class="btn-refresh" id="retry-load-events" style="margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: var(--text-primary); color: var(--bg-dark); border: none; border-radius: 8px; font-size: 0.9375rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.opacity='0.9'; this.style.transform='translateY(-1px)'" onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)'">
        Refresh
    </button>
`;

const DAY_MAP: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    initializeDateInputs();
    loadEvents();
    setupEventListeners();
});

// Initialize date inputs with current month
function initializeDateInputs() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    monthSelector.value = `${year}-${month}`;
    updateMonthLabel();
    updateDateRangeFromMonth(false);
}

// Format date for date input
function formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function selectedMonth(): [year: number, month: number] {
    const [year, month] = monthSelector.value.split("-").map(Number);
    return [year, month];
}

function updateMonthLabel() {
    if (!monthLabel || !monthSelector.value) return;
    const [year, month] = selectedMonth();
    const labelDate = new Date(year, month - 1, 1);
    monthLabel.textContent = labelDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
}

function shiftMonth(delta: number) {
    if (!monthSelector.value) return;
    const [year, month] = selectedMonth();
    const d = new Date(year, month - 1 + delta, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    monthSelector.value = `${y}-${m}`;
    updateDateRangeFromMonth(true);
}

// Setup event listeners
function setupEventListeners() {
    setupEventModal();

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && eventModal.open) {
            eventModal.close();
        }
    });

    startDateInput.addEventListener("change", applyFilter);
    startDateInput.addEventListener("blur", applyFilter);
    endDateInput.addEventListener("change", applyFilter);
    endDateInput.addEventListener("blur", applyFilter);

    monthSelector.addEventListener("change", () => updateDateRangeFromMonth(true));

    if (prevMonthBtn) prevMonthBtn.addEventListener("click", () => shiftMonth(-1));
    if (nextMonthBtn) nextMonthBtn.addEventListener("click", () => shiftMonth(1));
}

// Update date range when month selector changes
function updateDateRangeFromMonth(shouldApply = true) {
    if (!monthSelector.value) return;

    const [year, month] = selectedMonth();
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    startDateInput.value = formatDateLocal(startOfMonth);
    endDateInput.value = formatDateLocal(endOfMonth);
    updateMonthLabel();

    if (shouldApply) {
        applyFilter();
    }
}

function bindRetryButton() {
    const refreshBtn = document.getElementById("retry-load-events");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            loadEvents();
        });
    }
}

// Load events from Google Calendar
async function loadEvents() {
    try {
        console.log("Fetching calendar events...");
        loadingState.classList.add("active");
        eventsContainer.innerHTML = "";

        // Use Google Calendar API v3 if API key is provided (expands recurring events automatically)
        if (API_KEY) {
            return await loadEventsFromAPI();
        }

        // Otherwise use iCal feed (requires manual RRULE expansion)
        await loadEventsFromICal();
    } catch (error) {
        console.error("Error loading events:", error);
        eventsContainer.innerHTML = `
            <div class="empty-state">
                <p>Unable to load events. Please try again later.</p>
                <p style="margin-top: 0.5rem; font-size: 0.875rem; opacity: 0.7;">Make sure the calendar is set to public.</p>
                ${RETRY_BUTTON}
            </div>
        `;
        bindRetryButton();
        loadingState.classList.remove("active");
    }
}

// Parse iCal format
function parseICal(icalData: string): ICalEvent[] {
    const events: ICalEvent[] = [];
    const lines = icalData.split(/\r?\n/);

    let currentEvent: ICalEvent | null = null;
    let inEvent = false;
    let currentProperty: TextProperty | "" = "";
    let currentValue = "";

    console.log("Total lines in iCal:", lines.length);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines
        if (!line) continue;

        // Handle line continuation (starts with space or tab - but we trimmed, so check original)
        const originalLine = lines[i];
        if (originalLine.startsWith(" ") || originalLine.startsWith("\t")) {
            if (currentProperty && currentEvent) {
                currentValue += " " + line;
            }
            continue;
        }

        // Save previous property value
        if (currentProperty && currentEvent) {
            currentEvent[currentProperty] = currentValue.trim();
            currentProperty = "";
            currentValue = "";
        }

        // Check for event start
        if (line === "BEGIN:VEVENT") {
            inEvent = true;
            currentEvent = {
                id: null,
                summary: "",
                description: "",
                location: "",
                start: null,
                end: null,
                rrule: null,
            };
            continue;
        }

        // Check for event end
        if (line === "END:VEVENT") {
            if (currentEvent) {
                // Save any remaining property
                if (currentProperty && currentValue) {
                    currentEvent[currentProperty] = currentValue.trim();
                }

                // Only add event if it has a start date
                if (currentEvent.start) {
                    // If no end date, set it to start date + 1 hour
                    if (!currentEvent.end) {
                        currentEvent.end = new Date(currentEvent.start.getTime() + 60 * 60 * 1000);
                    }
                    if (currentEvent.rrule) {
                        console.log("Found recurring event:", currentEvent.summary || "Untitled", "RRULE:", currentEvent.rrule);
                    }
                    events.push(currentEvent);
                    console.log("Added event:", currentEvent.summary || "Untitled", "Start:", currentEvent.start);
                } else {
                    console.log("Skipped event - no start date:", currentEvent);
                }
            }
            inEvent = false;
            currentEvent = null;
            currentProperty = "";
            currentValue = "";
            continue;
        }

        if (!inEvent || !currentEvent) continue;

        // Parse property
        const colonIndex = line.indexOf(":");
        if (colonIndex === -1) continue;

        const property = line.substring(0, colonIndex).toUpperCase();
        const value = line.substring(colonIndex + 1);

        // Handle property parameters (e.g., DTSTART;TZID=America/Los_Angeles:20240101T180000)
        const semicolonIndex = property.indexOf(";");
        const propertyName = semicolonIndex !== -1 ? property.substring(0, semicolonIndex) : property;

        switch (propertyName) {
            case "SUMMARY":
                currentProperty = "summary";
                currentValue = value;
                break;
            case "DESCRIPTION":
                currentProperty = "description";
                currentValue = value;
                break;
            case "LOCATION":
                currentProperty = "location";
                // Decode iCal escape sequences when parsing
                currentValue = decodeICalText(value);
                break;
            case "DTSTART": {
                const startDate = parseICalDate(value);
                if (startDate) {
                    currentEvent.start = startDate;
                } else {
                    console.log("Failed to parse DTSTART:", value);
                }
                break;
            }
            case "DTEND": {
                const endDate = parseICalDate(value);
                if (endDate) {
                    currentEvent.end = endDate;
                } else {
                    console.log("Failed to parse DTEND:", value);
                }
                break;
            }
            case "RRULE":
                currentProperty = "rrule";
                currentValue = value;
                break;
            case "UID":
                currentProperty = "id";
                // Google iCal UIDs look like "abc123@google.com"; API ids omit the domain
                currentValue = value.replace(/@google\.com$/i, "");
                break;
        }
    }

    // Save last property if exists
    if (currentProperty && currentEvent) {
        currentEvent[currentProperty] = currentValue.trim();
    }

    return events;
}

// Parse iCal date format
function parseICalDate(input: string): Date | null {
    if (!input) return null;

    // Google Calendar iCal format examples:
    // "20240101T180000Z" (UTC with Z)
    // "20240101T180000" (local time)
    // "20240101" (date only)
    const dateString = input.trim();

    // Check if it's a date-only format (YYYYMMDD)
    if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
        const year = parseInt(dateString.substring(0, 4));
        const month = parseInt(dateString.substring(4, 6)) - 1; // Month is 0-indexed
        const day = parseInt(dateString.substring(6, 8));
        return new Date(year, month, day, 0, 0, 0);
    }

    // Check if it's a date-time format (YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ)
    if (dateString.length >= 15 && dateString.includes("T")) {
        const datePart = dateString.substring(0, 8);
        const timePart = dateString.substring(9);

        const year = parseInt(datePart.substring(0, 4));
        const month = parseInt(datePart.substring(4, 6)) - 1;
        const day = parseInt(datePart.substring(6, 8));

        // Parse time part (HHMMSS or HHMMSSZ)
        const timeStr = timePart.replace("Z", "");
        let hours = 0;
        let minutes = 0;
        let seconds = 0;

        if (timeStr.length >= 6) {
            hours = parseInt(timeStr.substring(0, 2)) || 0;
            minutes = parseInt(timeStr.substring(2, 4)) || 0;
            seconds = parseInt(timeStr.substring(4, 6)) || 0;
        } else if (timeStr.length >= 4) {
            hours = parseInt(timeStr.substring(0, 2)) || 0;
            minutes = parseInt(timeStr.substring(2, 4)) || 0;
        }

        // If it ends with Z, it's UTC, otherwise treat as local
        if (dateString.endsWith("Z")) {
            return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
        }
        return new Date(year, month, day, hours, minutes, seconds);
    }

    console.log("Could not parse date string:", dateString);
    return null;
}

// Expand recurring events based on RRULE
function expandRecurringEvents(events: ICalEvent[]): ICalEvent[] {
    const expandedEvents: ICalEvent[] = [];
    const now = new Date();
    // Expand up to 1 year in the future to cover the date range selector
    const maxDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    for (const event of events) {
        // If event has RRULE, expand it (don't include the original template event)
        if (event.rrule && event.start) {
            const instances = expandRRULE(event, maxDate);
            expandedEvents.push(...instances);
            console.log(`Expanded recurring event "${event.summary || "Untitled"}" into ${instances.length} instances`);
        } else {
            // Non-recurring event, add it as-is
            expandedEvents.push(event);
        }
    }

    return expandedEvents;
}

// BYDAY values like "TH", "1TH" (first Thursday) or "-1TH" (last Thursday) → day of week
function targetDaysOf(rrule: RRule): number[] {
    return (rrule.byday || [])
        .map((d) => {
            const match = d.match(/^(-?\d+)?([A-Z]+)$/i);
            if (match) {
                return DAY_MAP[match[2].toUpperCase()];
            }
            return DAY_MAP[d.toUpperCase()];
        })
        .filter((d) => d !== null && d !== undefined);
}

function addUTCDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
}

// Parse and expand RRULE
function expandRRULE(event: ICalEvent, maxDate: Date): ICalEvent[] {
    if (!event.rrule || !event.start) return [];

    const instances: ICalEvent[] = [];
    const rrule = parseRRULE(event.rrule);

    if (!rrule) {
        console.log("Could not parse RRULE:", event.rrule);
        return [];
    }

    // Work in UTC: RRULEs are typically defined in UTC
    const startUTC = new Date(event.start);
    let currentDateUTC = new Date(
        Date.UTC(
            startUTC.getUTCFullYear(),
            startUTC.getUTCMonth(),
            startUTC.getUTCDate(),
            startUTC.getUTCHours(),
            startUTC.getUTCMinutes(),
            startUTC.getUTCSeconds()
        )
    );
    const duration = event.end ? event.end.getTime() - event.start.getTime() : 60 * 60 * 1000; // Default 1 hour
    let count = 0;
    const maxInstances = 500; // Safety limit

    console.log(`Expanding RRULE: ${event.rrule}`);
    console.log(`Start date UTC: ${currentDateUTC.toISOString()}`);
    console.log(`Start date Pacific: ${currentDateUTC.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}`);

    // For weekly events with BYDAY, check if the start date matches the BYDAY in UTC
    // If not, find the first matching occurrence
    if (rrule.freq === "WEEKLY" && rrule.byday && rrule.byday.length > 0) {
        const targetDays = targetDaysOf(rrule);

        // Check day of week in UTC
        const currentDayUTC = currentDateUTC.getUTCDay();
        console.log(`Target days (UTC): ${targetDays}, Current day (UTC): ${currentDayUTC}`);

        // If current date doesn't match any target day, find the first matching day
        if (targetDays.length > 0 && !targetDays.includes(currentDayUTC)) {
            // Preserve the original UTC time
            const originalUTCHours = currentDateUTC.getUTCHours();
            const originalUTCMinutes = currentDateUTC.getUTCMinutes();
            const originalUTCSeconds = currentDateUTC.getUTCSeconds();

            console.log(`Start date doesn't match target days in UTC, finding next match...`);

            // Find the next matching day within the next 7 days (in UTC)
            for (let i = 1; i <= 7; i++) {
                const checkDateUTC = addUTCDays(currentDateUTC, i);
                if (targetDays.includes(checkDateUTC.getUTCDay())) {
                    // Set the time to match the original event time (in UTC)
                    checkDateUTC.setUTCHours(originalUTCHours, originalUTCMinutes, originalUTCSeconds);
                    currentDateUTC = checkDateUTC;
                    console.log(`Adjusted to first matching day (UTC): ${currentDateUTC.toISOString()}`);
                    console.log(
                        `Adjusted to first matching day (Pacific): ${currentDateUTC.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}`
                    );
                    break;
                }
            }
        }
    }

    while (currentDateUTC <= maxDate && count < maxInstances) {
        const instanceStart = new Date(currentDateUTC.getTime());
        const instanceEnd = new Date(instanceStart.getTime() + duration);

        instances.push({
            id: event.id ? googleStyleInstanceId(event.id, instanceStart) : null,
            summary: event.summary,
            description: event.description,
            location: event.location,
            start: instanceStart,
            end: instanceEnd,
            rrule: null, // Mark as instance, not recurring
        });

        if (count < 3) {
            console.log(`Instance ${count + 1} UTC: ${currentDateUTC.toISOString()}`);
            console.log(
                `Instance ${count + 1} Pacific: ${instanceStart.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}`
            );
        }

        count++;

        // Calculate next occurrence based on FREQ (all in UTC)
        const interval = rrule.interval || 1;
        if (rrule.freq === "WEEKLY") {
            // Handle BYDAY if specified (e.g., BYDAY=TH for Thursdays)
            const targetDays = targetDaysOf(rrule);
            let daysToAdd = interval * 7;
            // Find the next matching day, looking up to 14 days (2 weeks) ahead
            for (let i = 1; targetDays.length > 0 && i <= 14; i++) {
                if (targetDays.includes(addUTCDays(currentDateUTC, i).getUTCDay())) {
                    daysToAdd = i;
                    break;
                }
            }
            currentDateUTC = addUTCDays(currentDateUTC, daysToAdd);
        } else if (rrule.freq === "DAILY") {
            currentDateUTC = addUTCDays(currentDateUTC, interval);
        } else if (rrule.freq === "MONTHLY") {
            currentDateUTC = new Date(currentDateUTC);
            currentDateUTC.setUTCMonth(currentDateUTC.getUTCMonth() + interval);
        } else if (rrule.freq === "YEARLY") {
            currentDateUTC = new Date(currentDateUTC);
            currentDateUTC.setUTCFullYear(currentDateUTC.getUTCFullYear() + interval);
        } else {
            // Unknown frequency, stop
            break;
        }

        // Check COUNT limit
        if (rrule.count && count >= rrule.count) {
            break;
        }

        // Check UNTIL limit (compare in UTC)
        if (rrule.until && currentDateUTC > rrule.until) {
            break;
        }
    }

    return instances;
}

// Parse RRULE string (e.g., "FREQ=WEEKLY;BYDAY=TH;INTERVAL=1")
function parseRRULE(rruleString: string): RRule | null {
    if (!rruleString) return null;

    const rrule: RRule = {};

    for (const part of rruleString.split(";")) {
        const [key, value] = part.split("=");
        if (!key || !value) continue;

        const upperKey = key.toUpperCase();

        if (upperKey === "FREQ") {
            rrule.freq = value.toUpperCase();
        } else if (upperKey === "INTERVAL") {
            rrule.interval = parseInt(value) || 1;
        } else if (upperKey === "COUNT") {
            rrule.count = parseInt(value);
        } else if (upperKey === "UNTIL") {
            rrule.until = parseICalDate(value);
        } else if (upperKey === "BYDAY") {
            // Handle multiple days (e.g., "MO,WE,FR" or single "TH")
            rrule.byday = value.split(",");
        }
    }

    return rrule.freq ? rrule : null;
}

// Load events using Google Calendar API v3 (expands recurring events automatically)
async function loadEventsFromAPI() {
    try {
        loadingState.classList.add("active");
        eventsContainer.innerHTML = "";

        // Get date range for filtering
        const startDate = startDateInput.value ? new Date(startDateInput.value) : new Date();
        const endDate = endDateInput.value ? new Date(endDateInput.value) : new Date();
        endDate.setHours(23, 59, 59, 999);

        const timeMin = startDate.toISOString();
        const timeMax = endDate.toISOString();
        const encodedCalendarId = encodeURIComponent(CALENDAR_ID);

        // singleEvents=true expands recurring events
        const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events?key=${API_KEY}&singleEvents=true&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=2500&orderBy=startTime`;

        console.log("Fetching from Google Calendar API v3...");
        console.log("API URL:", apiUrl.replace(API_KEY, "API_KEY_HIDDEN"));

        const response = await fetch(apiUrl);

        if (!response.ok) {
            let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage += ` - ${errorData.error.message || JSON.stringify(errorData.error)}`;
                }
            } catch {
                // If we can't parse error JSON, use the status text
            }

            if (response.status === 403) {
                errorMessage +=
                    "\n\nTroubleshooting 403 Forbidden:\n" +
                    '1. Ensure your Google Calendar is set to "Public" (Settings → Access permissions → Make available to public)\n' +
                    '2. Check that the API key has "Google Calendar API" enabled\n' +
                    "3. Verify API key restrictions allow your domain\n" +
                    "4. Make sure billing is enabled in Google Cloud Console (free tier is sufficient)";
            }

            throw new Error(errorMessage);
        }

        const data: ApiEventList = await response.json();
        console.log("API response received,", data.items?.length || 0, "events");

        const events: ICalEvent[] = (data.items || []).map((item) => ({
            id: item.id || null,
            summary: item.summary || "",
            description: item.description || "",
            location: item.location || "",
            start: item.start.dateTime ? new Date(item.start.dateTime) : new Date(item.start.date!),
            end: item.end?.dateTime ? new Date(item.end.dateTime) : new Date(item.end?.date as string),
            rrule: null, // Already expanded by API
        }));

        // The API already filtered by timeMin/timeMax, so these are the visible events
        filteredEvents = events
            .filter((event) => event.start)
            .sort((a, b) => a.start!.getTime() - b.start!.getTime());
        allEvents = filteredEvents;

        console.log("Processed", filteredEvents.length, "events from API");
        loadingState.classList.remove("active");
        renderEvents();
    } catch (error) {
        console.error("Error loading events from API:", error);

        const errorMsg = error instanceof Error ? error.message : String(error);
        const is403 = errorMsg.includes("403");

        eventsContainer.innerHTML = `
            <div class="empty-state">
                <p>Unable to load events from Google Calendar API.</p>
                <p style="margin-top: 0.5rem; font-size: 0.875rem; opacity: 0.7;">Error: ${escapeHtml(errorMsg.split("\n")[0])}</p>
                ${
                    is403
                        ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px; text-align: left;">
                        <p style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem;">Troubleshooting 403 Forbidden:</p>
                        <ol style="font-size: 0.8125rem; opacity: 0.9; margin-left: 1.5rem; line-height: 1.6;">
                            <li>Ensure your Google Calendar is set to <strong>"Public"</strong><br>
                                (Settings → Access permissions → Make available to public)</li>
                            <li>Check that the API key has <strong>"Google Calendar API"</strong> enabled</li>
                            <li>Verify API key restrictions allow your domain</li>
                            <li>Make sure <strong>billing is enabled</strong> in Google Cloud Console<br>
                                (Free tier is sufficient, but billing must be enabled)</li>
                        </ol>
                    </div>
                `
                        : ""
                }
                <p style="margin-top: 1rem; font-size: 0.875rem; opacity: 0.7;">Falling back to iCal feed...</p>
            </div>
        `;
        loadingState.classList.remove("active");
        // Fall back to the iCal feed
        setTimeout(() => {
            loadEventsFromICal();
        }, 1000);
    } finally {
        loadingState.classList.remove("active");
    }
}

interface ProxyService {
    name: string;
    url: string;
    parse: (data: unknown) => string | null;
}

// Load events from iCal feed (fallback method)
async function loadEventsFromICal() {
    try {
        loadingState.classList.add("active");
        eventsContainer.innerHTML = "";

        // Try direct fetch first, then fallback to CORS proxy
        const calendarUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;
        console.log("Calendar URL (iCal):", calendarUrl);

        let icalData: string | null = null;

        try {
            console.log("Attempting direct fetch...");
            const directResponse = await fetch(calendarUrl);
            if (directResponse.ok) {
                icalData = await directResponse.text();
                console.log("Direct fetch successful, received", icalData.length, "characters");
            } else {
                throw new Error("Direct fetch failed");
            }
        } catch {
            // Fallback to CORS proxies (try multiple services)
            console.log("Direct fetch failed, trying CORS proxies...");

            const asText = (data: unknown) => (typeof data === "string" ? data : null);
            const proxyServices: ProxyService[] = [
                {
                    name: "allorigins.win",
                    url: `https://api.allorigins.win/get?url=${encodeURIComponent(calendarUrl)}`,
                    parse: (data) => (data as { contents?: string } | null)?.contents ?? null,
                },
                {
                    name: "corsproxy.io",
                    url: `https://corsproxy.io/?${encodeURIComponent(calendarUrl)}`,
                    parse: asText,
                },
                {
                    name: "cors-anywhere (herokuapp)",
                    url: `https://cors-anywhere.herokuapp.com/${calendarUrl}`,
                    parse: asText,
                },
            ];

            let proxySuccess = false;
            for (const proxy of proxyServices) {
                try {
                    console.log(`Trying proxy: ${proxy.name}...`);
                    const proxyResponse = await fetch(proxy.url, {
                        headers: {
                            "X-Requested-With": "XMLHttpRequest",
                        },
                    });

                    if (proxyResponse.ok) {
                        // allorigins returns JSON; the others return the raw feed
                        const body = await proxyResponse.text();
                        let proxyData: unknown;
                        try {
                            proxyData = JSON.parse(body);
                        } catch {
                            proxyData = body;
                        }

                        icalData = proxy.parse(proxyData);

                        if (icalData) {
                            console.log(`Proxy ${proxy.name} successful, received`, icalData.length, "characters");

                            // Check if it's a data URI (base64 encoded)
                            if (icalData.startsWith("data:")) {
                                console.log("Detected data URI, decoding base64...");
                                const base64Match = icalData.match(/base64,(.+)$/);
                                if (base64Match && base64Match[1]) {
                                    try {
                                        icalData = atob(base64Match[1]);
                                        console.log("Decoded base64, now", icalData.length, "characters");
                                    } catch (e) {
                                        console.error("Failed to decode base64:", e);
                                        continue; // Try next proxy
                                    }
                                }
                            }

                            proxySuccess = true;
                            break;
                        }
                    }
                } catch (proxyError) {
                    console.log(`Proxy ${proxy.name} failed:`, proxyError instanceof Error ? proxyError.message : proxyError);
                }
            }

            if (!proxySuccess) {
                throw new Error(
                    "All CORS proxy attempts failed. The calendar may need to be set to public, or there may be network issues."
                );
            }
        }

        if (!icalData) {
            throw new Error("No calendar data received");
        }

        console.log("Parsing iCal data...");
        console.log("First 500 characters of iCal data:", icalData.substring(0, 500));
        const events = parseICal(icalData);
        console.log("Parsed", events.length, "events");
        if (events.length > 0) {
            console.log("Sample event:", events[0]);
        }

        const expandedEvents = expandRecurringEvents(events);
        console.log("Expanded to", expandedEvents.length, "events (including recurring instances)");

        allEvents = expandedEvents
            .filter((event) => event.start)
            .sort((a, b) => a.start!.getTime() - b.start!.getTime());
        console.log("Filtered to", allEvents.length, "events with valid dates");
        applyFilter();
    } catch (error) {
        console.error("Error loading events from iCal:", error);
        eventsContainer.innerHTML = `
            <div class="empty-state">
                <p>Unable to load events from Google Calendar.</p>
                <p style="margin-top: 0.5rem; font-size: 0.875rem; opacity: 0.7;">${escapeHtml(error instanceof Error ? error.message : String(error))}</p>
                <p style="margin-top: 1rem; font-size: 0.875rem; opacity: 0.7;">
                    <strong>Troubleshooting:</strong><br>
                    1. Ensure your Google Calendar is set to "Public"<br>
                    2. In Calendar Settings → Access permissions → Make available to public<br>
                    3. Check that the calendar ID is correct: ${CALENDAR_ID}
                </p>
                ${RETRY_BUTTON}
            </div>
        `;
        bindRetryButton();
    } finally {
        loadingState.classList.remove("active");
    }
}

// Apply date filter
async function applyFilter() {
    const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
    const endDate = endDateInput.value ? new Date(endDateInput.value) : null;

    // Set end date to end of day (23:59:59)
    if (endDate) {
        endDate.setHours(23, 59, 59, 999);
    }

    console.log("Applying filter - Start:", startDate, "End:", endDate);

    // If using API, re-fetch from API with new date range instead of filtering
    if (API_KEY) {
        console.log("Using API - re-fetching events for new date range");
        await loadEventsFromAPI();
        return;
    }

    // For iCal feed, filter existing events
    filteredEvents = allEvents.filter((event) => {
        if (startDate && event.start! < startDate) return false;
        if (endDate && event.start! > endDate) return false;
        return true;
    });

    console.log("Filtered to", filteredEvents.length, "events");
    renderEvents();
}

// Render events as a month grid
function renderEvents() {
    if (!monthSelector.value) {
        eventsContainer.innerHTML = `
            <div class="empty-state">
                <p>Select a month to view events.</p>
            </div>
        `;
        return;
    }

    const [year, month] = selectedMonth();
    const firstOfMonth = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    // Sunday-start week (US)
    const startWeekday = firstOfMonth.getDay();

    const eventsByDay: Record<string, ICalEvent[]> = {};
    filteredEvents.forEach((event) => {
        if (!event.start) return;
        const key = pacificDateKey(event.start);
        if (!eventsByDay[key]) eventsByDay[key] = [];
        eventsByDay[key].push(event);
    });

    const todayKey = pacificDateKey(new Date());
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let html = weekdays.map((d) => `<div class="month-grid-weekday" role="columnheader">${d}</div>`).join("");

    // Leading empty days from previous month
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    for (let i = 0; i < startWeekday; i++) {
        const dayNum = prevMonthLastDay - startWeekday + 1 + i;
        html += `<div class="month-day outside" aria-hidden="true"><span class="month-day-num">${dayNum}</span></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const dayEvents = eventsByDay[key] || [];
        const classes = ["month-day"];
        if (key === todayKey) classes.push("today");
        if (dayEvents.length) classes.push("has-events");

        const eventButtons = dayEvents
            .map((event, idx) => {
                const title = escapeHtml(event.summary || "Untitled Event");
                return `<button type="button" class="month-event" data-event-key="${key}" data-event-index="${idx}" title="${title}">${title}</button>`;
            })
            .join("");

        html += `
            <div class="${classes.join(" ")}" data-day-key="${key}" role="gridcell">
                <span class="month-day-num">${day}</span>
                <div class="month-day-events">${eventButtons}</div>
                <span class="month-event-dot" aria-hidden="true"></span>
            </div>
        `;
    }

    // Trailing days to complete the grid
    const totalCells = startWeekday + daysInMonth;
    const trailing = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= trailing; i++) {
        html += `<div class="month-day outside" aria-hidden="true"><span class="month-day-num">${i}</span></div>`;
    }

    eventsContainer.innerHTML = html;

    eventsContainer.querySelectorAll(".month-event").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const key = btn.getAttribute("data-event-key") ?? "";
            const idx = parseInt(btn.getAttribute("data-event-index") ?? "", 10);
            const list = eventsByDay[key];
            if (list && list[idx]) showEventModal(list[idx]);
        });
    });

    // On narrow screens, tapping a day with events opens the first event
    eventsContainer.querySelectorAll(".month-day.has-events").forEach((cell) => {
        cell.addEventListener("click", (e) => {
            if ((e.target as Element).closest(".month-event")) return;
            if (window.matchMedia("(max-width: 640px)").matches) {
                const list = eventsByDay[cell.getAttribute("data-day-key") ?? ""];
                if (list && list.length) showEventModal(list[0]);
            }
        });
    });
}

// YYYY-MM-DD in America/Los_Angeles
function pacificDateKey(date: Date): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Los_Angeles",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
    return `${part("year")}-${part("month")}-${part("day")}`;
}

function googleStyleInstanceId(baseId: string, start: Date): string {
    // Avoid double-suffix if id is already an instance id
    if (/_\d{8}T\d{6}Z$/.test(baseId)) return baseId;
    return `${baseId}_${instanceStamp(start)}`;
}

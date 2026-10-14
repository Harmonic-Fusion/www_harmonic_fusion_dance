import { Base } from "../_includes/components/Base.tsx";
import { EventModal } from "../_includes/components/EventModal.tsx";
import { Footer } from "../_includes/components/Footer.tsx";

export default function Calendar() {
    return (
        <Base
            title="Calendar | Harmonic Fusion"
            description="Upcoming Harmonic Fusion events — calendar view for Eugene fusion dances and more."
            stylesheets={["/site.css", "/calendar.css"]}
            nav={{ current: "calendar" }}
            scripts={["calendar"]}
        >
            <div className="container">
                <header className="calendar-page-header">
                    <h1>Calendar</h1>
                    <p>Upcoming Harmonic Fusion events</p>
                </header>

                <div className="calendar-section">
                    <div className="add-to-google-calendar">
                        <a
                            href="https://calendar.google.com/calendar/u/0?cid=aGFybW9uaWNmdXNpb25kYW5jZUBnbWFpbC5jb20"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-add-to-google-calendar"
                            id="add-to-google-calendar"
                        >
                            Add to Google Calendar
                        </a>
                    </div>

                    <div className="calendar-toolbar">
                        <button type="button" className="calendar-nav-btn" id="prev-month" aria-label="Previous month">
                            ‹
                        </button>
                        <div className="calendar-month-label" id="month-label" aria-live="polite"></div>
                        <button type="button" className="calendar-nav-btn" id="next-month" aria-label="Next month">
                            ›
                        </button>
                    </div>

                    {/* Hidden inputs kept for the calendar date-range logic */}
                    <input type="month" id="month-selector" className="sr-only" tabIndex={-1} aria-hidden="true" />
                    <input type="date" id="start-date" className="sr-only" tabIndex={-1} aria-hidden="true" />
                    <input type="date" id="end-date" className="sr-only" tabIndex={-1} aria-hidden="true" />

                    <div className="loading-state" id="loading-state">
                        <div className="spinner"></div>
                        <p>Loading events...</p>
                    </div>

                    <div className="month-grid" id="events-container" role="grid" aria-label="Month calendar"></div>
                </div>

                <EventModal />

                <Footer />
            </div>
        </Base>
    );
}

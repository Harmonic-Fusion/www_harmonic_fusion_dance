import { Base } from "../_includes/components/Base.tsx";
import { Footer } from "../_includes/components/Footer.tsx";

// Shell for /calendar/{eventId}. The event is loaded client-side from Google Calendar.
export const data = { permalink: "/calendar/event.html" };

export default function CalendarEvent() {
    return (
        <Base
            title="Event | Harmonic Fusion"
            description="Harmonic Fusion event details"
            stylesheets={["/site.css", "/calendar.css"]}
            nav={{ current: "calendar" }}
            scripts={["calendar-event"]}
        >
            <div className="container">
                <p className="event-page-back">
                    <a href="/calendar/">← Back to calendar</a>
                </p>

                <div className="loading-state active" id="loading-state">
                    <div className="spinner"></div>
                    <p>Loading event...</p>
                </div>

                <div className="event-page empty-state" id="error-state" hidden>
                    <p id="error-message">Event not found.</p>
                    <p style={{ marginTop: "1rem" }}>
                        <a href="/calendar/">View the calendar</a>
                    </p>
                </div>

                <article className="event-page" id="event-content" hidden>
                    <header className="event-page-header">
                        <h1 id="event-title"></h1>
                    </header>

                    <div className="event-page-details">
                        <div className="modal-detail-item">
                            <span className="modal-label">Time</span>
                            <span id="event-time" className="modal-value"></span>
                        </div>
                        <div className="modal-detail-item">
                            <span className="modal-label">Location</span>
                            <span id="event-location" className="modal-value"></span>
                        </div>
                        <div className="modal-detail-item modal-description">
                            <span className="modal-label">Description</span>
                            <div id="event-description" className="modal-value"></div>
                        </div>
                    </div>

                    <div className="event-page-actions">
                        <a href="/calendar/" className="btn-copy-link event-page-calendar-link">
                            Full Calendar
                        </a>
                        <button type="button" className="btn-add-to-google-calendar" id="copy-link">
                            Copy Link
                        </button>
                    </div>
                </article>

                <Footer />
            </div>
        </Base>
    );
}

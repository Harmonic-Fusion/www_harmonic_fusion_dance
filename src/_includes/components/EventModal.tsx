// Event details dialog filled in by src/scripts/lib/event-modal.ts.
export function EventModal() {
    return (
        <dialog id="event-modal" className="event-modal">
            <div className="modal-content">
                <button className="modal-close" id="modal-close" aria-label="Close modal">
                    &times;
                </button>
                <h3 id="modal-title" className="modal-title"></h3>
                <div className="modal-details">
                    <div className="modal-detail-item">
                        <span className="modal-label">Time</span>
                        <span id="modal-time" className="modal-value"></span>
                    </div>
                    <div className="modal-detail-item">
                        <span className="modal-label">Location</span>
                        <span id="modal-location" className="modal-value"></span>
                    </div>
                    <div className="modal-detail-item modal-description">
                        <span className="modal-label">Description</span>
                        <div id="modal-description" className="modal-value"></div>
                    </div>
                </div>
                <p className="modal-view-event-wrap">
                    <a id="modal-view-event" className="btn modal-view-event" href="#">
                        View Event
                    </a>
                </p>
            </div>
        </dialog>
    );
}

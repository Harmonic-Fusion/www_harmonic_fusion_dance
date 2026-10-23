import { Base } from "./_includes/components/Base.tsx";
import { Footer } from "./_includes/components/Footer.tsx";

export const data = { permalink: "/success.html" };

export default function Success() {
    return (
        <Base
            title="Thanks for subscribing | Harmonic Fusion"
            description="You're on the Harmonic Fusion list for Thursday dances and community gatherings."
            stylesheets={["/site.css", "/success.css"]}
            scripts={["site"]}
        >
            <div className="container">
                <main className="success">
                    <h1>Thanks for subscribing</h1>
                    <p>You're on the list. We'll send notes about Thursday dances and community gatherings.</p>
                    <div className="success-actions">
                        <a className="btn" href="/">
                            Back to the dance floor
                        </a>
                        <a className="btn-secondary" href="/calendar/">
                            See the calendar
                        </a>
                    </div>
                </main>
                <Footer />
            </div>
        </Base>
    );
}

import { Base } from "./_includes/components/Base.tsx";
import { Footer } from "./_includes/components/Footer.tsx";

export const data = { permalink: "/404.html" };

// GitHub Pages serves this for unknown paths. Recover shareable /calendar/{eventId}
// URLs by swapping in the event page (nginx and the dev server rewrite these directly).
const recoverEventPage = `
(function () {
    var match = location.pathname.match(/^\\/calendar\\/([^/]+)\\/?$/);
    if (!match) return;
    var segment = decodeURIComponent(match[1]);
    if (!segment || segment.indexOf('.') !== -1 || segment === 'index') return;

    fetch('/calendar/event.html')
        .then(function (res) {
            if (!res.ok) throw new Error('Page missing');
            return res.text();
        })
        .then(function (html) {
            document.open();
            document.write(html);
            document.close();
        })
        .catch(function () {
            /* fall through to normal 404 UI */
        });
})();
`;

export default function NotFound() {
    return (
        <Base
            title="Lost the beat — Harmonic Fusion"
            description="Page not found — Harmonic Fusion, weekly fusion dance in Eugene, Oregon."
            robots="noindex"
            themeColorScheme={false}
            analytics={false}
            stylesheets={["/site.css", "/404.css"]}
            head={<script dangerouslySetInnerHTML={{ __html: recoverEventPage }} />}
            scripts={["site"]}
        >
            <div className="container">
                <main className="notfound">
                    <p className="notfound-code" aria-label="404">
                        <span aria-hidden="true">4</span>
                        <span className="notfound-spin" aria-hidden="true">
                            0
                        </span>
                        <span aria-hidden="true">4</span>
                    </p>

                    <p className="notfound-dancers" aria-hidden="true">
                        <span>💃</span>
                        <span>🕺</span>
                    </p>

                    <h1 className="notfound-title">This page lost the beat</h1>
                    <p className="notfound-text">
                        It twirled off somewhere and never came back. Happens to the best of us — let's find you a new partner.
                    </p>

                    <div className="notfound-actions">
                        <a className="btn" href="/">
                            Back to the dance floor
                        </a>
                        <a className="btn-secondary" href="/calendar/">
                            See the calendar
                        </a>
                    </div>
                </main>

                <Footer
                    links={[
                        ["/", "Home"],
                        ["/terms.html", "Terms & Liability"],
                    ]}
                />
            </div>
        </Base>
    );
}

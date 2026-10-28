import { Base } from "../_includes/components/Base.tsx";
import { Footer } from "../_includes/components/Footer.tsx";
import { site } from "../_includes/site.ts";
import { BFF_SHEET_URL } from "../scripts/lib/bff.ts";

const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeWuIkgshEZGwvVRlyh8H3JvQWSKbIeYD85H2xufsb3Oxj_qA/viewform?embedded=true";

const SHARE_URL = `${site.origin}/BFF26/`;
const SHARE_TEXT =
  "Harmonic Fusion is giving away All-Access passes to Barefoot Fusion Festival 2026. Enter by November 8.";

export const data = { permalink: "/BFF26/" };

export default function Bff26() {
  return (
    <Base
      title="BFF Pass Giveaway | Harmonic Fusion"
      description="Enter to win an All-Access pass to Barefoot Fusion Festival 2026. Entries close November 8. Winners are drawn November 9."
      stylesheets={["/site.css", "/BFF26/bff26.css"]}
      scripts={["bff26"]}
    >
      <div className="container">
        <header className="bff-header">
          <h1>BFF Pass Giveaway</h1>
          <p className="lede">
            All-Access passes to Barefoot Fusion Festival 2026, November 20–22
            in Portland.
          </p>
          <div className="bff-live" data-sheet-url={BFF_SHEET_URL}>
            <div className="bff-countdown" role="timer" aria-live="off">
              <p className="bff-countdown-label">Entries close…</p>
              <div className="bff-countdown-units">
                <div className="bff-countdown-unit">
                  <span className="bff-countdown-value" data-unit="days">—</span>
                  <span className="bff-countdown-name">days</span>
                </div>
                <div className="bff-countdown-unit">
                  <span className="bff-countdown-value" data-unit="hours">—</span>
                  <span className="bff-countdown-name">hours</span>
                </div>
                <div className="bff-countdown-unit">
                  <span className="bff-countdown-value" data-unit="minutes">—</span>
                  <span className="bff-countdown-name">minutes</span>
                </div>
                <div className="bff-countdown-unit">
                  <span className="bff-countdown-value" data-unit="seconds">—</span>
                  <span className="bff-countdown-name">seconds</span>
                </div>
              </div>
              <p className="bff-countdown-closed">Entries are closed.</p>
            </div>
            <p className="bff-meta">
              <span>
                <span data-stat="submissions">—</span>{" "}
                <span data-stat="submissions-label">submissions</span>
              </span>
              <span className="bff-meta-sep" aria-hidden="true">
                ·
              </span>
              <span>
                Drawing <span data-stat="drawing">—</span>
              </span>
            </p>
          </div>
        </header>

        <section
          className="bff-share"
          aria-labelledby="share-heading"
          data-share-url={SHARE_URL}
          data-share-text={SHARE_TEXT}
        >
          <h2 id="share-heading">Pass this page along</h2>
          <div className="bff-share-actions">
            <button type="button" className="btn" id="bff-copy">
              Copy link
            </button>
            <button
              type="button"
              className="btn bff-share-native"
              id="bff-share"
              hidden
            >
              Share
            </button>
          </div>
          <p
            className="bff-share-status"
            id="bff-share-status"
            role="status"
            aria-live="polite"
          ></p>
        </section>

        <div className="bff-frame">
          <iframe
            src={FORM_URL}
            title="Harmonic Fusion's BFF Pass Giveaway"
            loading="lazy"
          >
            Loading…
          </iframe>
        </div>

        <Footer />
      </div>
    </Base>
  );
}

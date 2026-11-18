import { Base } from "./_includes/components/Base.tsx";

export const data = { permalink: "/liability-waiver.html" };

export default function LiabilityWaiver() {
  return (
    <Base
      title="Liability Waiver - Harmonic Fusion"
      analytics={false}
      stylesheets={["/liability-waiver.css"]}
      nav={false}
    >
      <main className="waiver-page">
        <header className="waiver-header">
          <h1>Liability Waiver</h1>
        </header>

        <section
          className="waiver-form-container"
          aria-label="Liability waiver form"
        >
          <iframe
            className="waiver-form-iframe"
            src="https://app.opensignlabs.com/publicsign?templateid=dUw1DZVzTQ"
            title="Liability Waiver Form"
            loading="lazy"
          ></iframe>
        </section>
      </main>
    </Base>
  );
}

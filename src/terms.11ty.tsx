import { Base } from "./_includes/components/Base.tsx";

export const data = { permalink: "/terms.html" };

export default function Terms() {
    return (
        <Base title="Terms & Liability - Harmonic Fusion" analytics={false} stylesheets={["/terms.css"]} nav={false}>
            <div className="container">
                <a href="/" className="back-link">
                    ← Back to Home
                </a>

                <div className="header">
                    <h1>Terms &amp; Liability</h1>
                </div>

                <div className="doc-container">
                    <iframe
                        className="doc-iframe"
                        src="https://docs.google.com/document/d/18me-mLgK3c0IRwtjqVypzJUh_ffcXS80-Ss0A69VOug/preview"
                        allow="autoplay"
                        title="Terms and Liability Form"
                    ></iframe>
                </div>
            </div>
        </Base>
    );
}

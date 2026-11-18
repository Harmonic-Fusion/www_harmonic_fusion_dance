import { Base } from "../../_includes/components/Base.tsx";

export const data = { permalink: "/liability-waiver/complete/" };

export default function LiabilityWaiverComplete() {
    return (
        <Base
            title="Liability Waiver Complete - Harmonic Fusion"
            analytics={false}
            stylesheets={["/liability-waiver.css"]}
            nav={false}
        >
            <main className="waiver-page">
                <header className="waiver-header">
                    <h1>Liability Waiver Complete</h1>
                </header>

                <section className="waiver-form-container" aria-label="Waiver completion message">
                    <div style={{ padding: "2rem", textAlign: "center" }}>
                        <p>Thank you. Your liability waiver has been submitted successfully.</p>
                    </div>
                </section>
            </main>
        </Base>
    );
}

import type { ReactNode } from "react";
import { Base } from "../_includes/components/Base.tsx";

type Option = [value: string, label: string];

const DOT_STYLES: Option[] = [
    ["square", "Square"],
    ["dots", "Dots"],
    ["rounded", "Rounded"],
    ["extra-rounded", "Extra rounded"],
    ["classy", "Classy"],
    ["classy-rounded", "Classy rounded"],
];
const CORNER_SQUARE_STYLES: Option[] = [
    ["square", "Square"],
    ["dot", "Dot"],
    ["rounded", "Rounded"],
    ["extra-rounded", "Extra rounded"],
    ["dots", "Dots"],
    ["classy", "Classy"],
    ["classy-rounded", "Classy rounded"],
];
const CORNER_DOT_STYLES: Option[] = [
    ["square", "Square"],
    ["dot", "Dot"],
    ["rounded", "Rounded"],
    ["dots", "Dots"],
    ["classy", "Classy"],
    ["classy-rounded", "Classy rounded"],
    ["extra-rounded", "Extra rounded"],
];
const EC_LEVELS: Option[] = [
    ["L", "L — Low (~7%)"],
    ["M", "M — Medium (~15%)"],
    ["Q", "Q — Quartile (~25%)"],
    ["H", "H — High (~30%)"],
];

function Select({ id, label, options, value }: { id: string; label: string; options: Option[]; value: string }) {
    return (
        <div className="field">
            <label htmlFor={id}>{label}</label>
            <select id={id} defaultValue={value}>
                {options.map(([optionValue, optionLabel]) => (
                    <option key={optionValue} value={optionValue}>
                        {optionLabel}
                    </option>
                ))}
            </select>
        </div>
    );
}

// A range slider paired with a number input; src/scripts/pages/qr.ts keeps them in sync.
function SyncedRange(props: {
    id: string;
    label: string;
    min: number;
    max: number;
    value: number;
    numberLabel: string;
    hint?: ReactNode;
}) {
    const { id, label, min, max, value, numberLabel, hint } = props;
    return (
        <div className="field">
            <div className="field-row">
                <label htmlFor={id}>{label}</label>
            </div>
            <div className="synced-controls">
                <input type="range" id={id} min={min} max={max} step={1} defaultValue={value} />
                <input
                    type="number"
                    id={`${id}-number`}
                    min={min}
                    max={max}
                    step={1}
                    defaultValue={value}
                    aria-label={numberLabel}
                />
            </div>
            {hint && <span className="hint">{hint}</span>}
        </div>
    );
}

export default function QrGenerator() {
    return (
        <Base
            title="QR Generator"
            robots="noindex, nofollow"
            analytics={false}
            stylesheets={["/qr/qr.css"]}
            nav={false}
            externalScripts={["https://cdn.jsdelivr.net/npm/qr-code-styling@1.9.2/lib/qr-code-styling.js"]}
            scripts={["qr"]}
        >
            <div className="container">
                <a href="/" className="back-link">
                    ← Back to Home
                </a>

                <header className="header">
                    <h1>QR Generator</h1>
                    <p>Generate styled QR codes entirely in your browser. Content never leaves this page.</p>
                </header>

                <div className="layout">
                    <section className="panel" aria-labelledby="controls-heading">
                        <h2 id="controls-heading">Controls</h2>

                        <div className="field">
                            <label htmlFor="qr-data">Content</label>
                            <textarea
                                id="qr-data"
                                spellCheck={false}
                                maxLength={2953}
                                placeholder="https://example.com or any text"
                                defaultValue="https://harmonicfusion.dance"
                            ></textarea>
                            <span className="hint" id="char-count">
                                0 characters
                            </span>
                        </div>

                        <SyncedRange id="qr-size" label="Size (px)" min={128} max={1024} value={300} numberLabel="Size in pixels" />
                        <SyncedRange id="qr-margin" label="Margin" min={0} max={80} value={10} numberLabel="Margin" />

                        <Select id="qr-error-correction" label="Error correction" options={EC_LEVELS} value="Q" />

                        <div className="color-grid">
                            <div className="field">
                                <label htmlFor="qr-foreground">Foreground</label>
                                <input type="color" id="qr-foreground" defaultValue="#000000" />
                            </div>
                            <div className="field">
                                <label htmlFor="qr-background">Background</label>
                                <input type="color" id="qr-background" defaultValue="#ffffff" />
                            </div>
                        </div>

                        <Select id="qr-dots-style" label="Module style" options={DOT_STYLES} value="square" />
                        <Select
                            id="qr-corner-square-style"
                            label="Corner square style"
                            options={CORNER_SQUARE_STYLES}
                            value="square"
                        />
                        <Select id="qr-corner-dot-style" label="Corner dot style" options={CORNER_DOT_STYLES} value="square" />

                        <SyncedRange
                            id="qr-radius"
                            label="Background corner radius (px)"
                            min={0}
                            max={512}
                            value={0}
                            numberLabel="Background corner radius in pixels"
                        />
                        <SyncedRange
                            id="qr-logo-width"
                            label="Logo space width (px)"
                            min={0}
                            max={512}
                            value={0}
                            numberLabel="Logo space width in pixels"
                            hint="Leave a blank centered area for a logo. Default is no space."
                        />
                        <SyncedRange
                            id="qr-logo-height"
                            label="Logo space height (px)"
                            min={0}
                            max={512}
                            value={0}
                            numberLabel="Logo space height in pixels"
                        />

                        <Select
                            id="qr-download-format"
                            label="Download format"
                            options={[
                                ["png", "PNG"],
                                ["svg", "SVG"],
                            ]}
                            value="png"
                        />
                    </section>

                    <section className="panel preview-panel" aria-labelledby="preview-heading">
                        <h2 id="preview-heading">Preview</h2>
                        <div className="preview-frame">
                            <div id="qr-preview" aria-live="polite"></div>
                        </div>
                        <p className="status" id="qr-status" role="status" data-tone="ok">
                            Ready
                        </p>
                        <div className="actions">
                            <button type="button" className="btn" id="download-btn">
                                Download
                            </button>
                            <button type="button" className="btn btn-secondary" id="copy-data-btn">
                                Copy content
                            </button>
                        </div>
                    </section>
                </div>

                <p className="footer-note">Private utility page — not linked from the main site.</p>
            </div>
        </Base>
    );
}

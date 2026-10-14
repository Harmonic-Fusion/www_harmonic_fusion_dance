import type { CSSProperties } from "react";
import { Base } from "./_includes/components/Base.tsx";

export const data = { permalink: "/styles.html" };

const FONTS =
    "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Merriweather:wght@400;700&family=Literata:wght@400;700&family=Montserrat:wght@400;600;700&display=swap";

const HEADING_SAMPLES: [string, CSSProperties][] = [
    ["Merriweather", { fontFamily: "'Merriweather', serif", fontSize: "2.5rem", fontWeight: 700 }],
    ["Literata", { fontFamily: "'Literata', serif", fontSize: "2.5rem", fontWeight: 700 }],
    ["Montserrat", { fontFamily: "'Montserrat', sans-serif", fontSize: "2.5rem", fontWeight: 700 }],
];

export default function StyleGuide() {
    return (
        <Base
            title="Style Guide - Harmonic Blues Fusion"
            head={
                <>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                </>
            }
            stylesheets={[FONTS, "/style-guide.css"]}
            nav={false}
            scripts={["style-guide"]}
        >
            <div className="container">
                <section>
                    <h2>Typography</h2>
                    <div className="typography-examples">
                        <div className="font-sample">
                            <div className="font-label">Heading Font: National Park</div>
                            <div className="heading-sample" style={{ fontSize: "2.5rem", fontWeight: 400 }}>
                                Heading Example
                            </div>
                        </div>
                        {HEADING_SAMPLES.map(([name, style]) => (
                            <div className="font-sample" key={name}>
                                <div className="font-label">Heading Font: {name}</div>
                                <div style={style}>Heading Example</div>
                            </div>
                        ))}
                        <div className="font-sample">
                            <div className="font-label">Body Font: Open Sans</div>
                            <div className="body-sample" style={{ fontSize: "1rem" }}>
                                This is a sample of the body font. Open Sans provides excellent readability for body text,
                                paragraphs, and general content. It's clean, modern, and works well across all devices.
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <h2>Colors</h2>
                    <div className="colors-grid" id="colorsGrid"></div>
                </section>
            </div>

            <div className="toast" id="toast">
                Color copied to clipboard!
            </div>
        </Base>
    );
}

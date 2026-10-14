import { Base } from "./_includes/components/Base.tsx";
import { EventModal } from "./_includes/components/EventModal.tsx";
import { Footer } from "./_includes/components/Footer.tsx";
import { site } from "./_includes/site.ts";

const SLIDES = [
    ["DSC_7336.jpg", "Eugene Fusion dancers"],
    ["DSC_7428.jpg", "Eugene Fusion dance floor"],
    ["DSC_7472.jpg", "Eugene Fusion evening"],
    ["DSC_8032.jpg", "Eugene Fusion gathering"],
    ["DSC_8091.jpg", "Eugene Fusion dance"],
];

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    description: "Weekly fusion dance every Thursday at the Veteran's Memorial Club in Eugene, Oregon",
    url: site.origin,
    logo: {
        "@type": "ImageObject",
        url: `${site.origin}/icons/dark/icon-256.png`,
        width: 256,
        height: 256,
    },
    address: {
        "@type": "PostalAddress",
        addressLocality: "Eugene",
        addressRegion: "Oregon",
        addressCountry: "US",
    },
    email: site.email,
};

export default function Home() {
    return (
        <Base
            title="Harmonic Fusion"
            description="Harmonic Fusion — weekly fusion dance every Thursday in Eugene, Oregon. Lessons and teaching with Dylan."
            stylesheets={["/site.css", "/home.css"]}
            jsonLd={jsonLd}
            nav={{ current: "home", hide: ["blog"] }}
            scripts={["home"]}
        >
            <div className="container">
                <div
                    className="logo-section"
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%" }}
                >
                    <img src="/logo.png" alt="Harmonic Fusion logo" style={{ display: "block" }} />
                    <h1 style={{ display: "block", width: "100%", textAlign: "center" }}>Harmonic Fusion</h1>
                </div>

                <div className="announcement">
                    <p>
                        Our mission is to nurture a vibrant community who dance, play, connect, care, and love. We create harmony
                        between differences and enrich the fusion dance scene in Eugene through joyful, heart-led gatherings.
                    </p>
                </div>

                <div
                    className="carousel"
                    data-carousel
                    tabIndex={0}
                    role="region"
                    aria-roledescription="carousel"
                    aria-label="Eugene Fusion photos"
                >
                    <div className="carousel-viewport">
                        <div className="carousel-track" data-carousel-track>
                            {SLIDES.map(([file, alt]) => (
                                <div className="carousel-slide" data-carousel-slide key={file}>
                                    <img src={`/images/eugene/web/${file}`} alt={alt} loading="lazy" width="1200" height="800" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <button type="button" className="carousel-btn prev" data-carousel-prev aria-label="Previous photo">
                        ‹
                    </button>
                    <button type="button" className="carousel-btn next" data-carousel-next aria-label="Next photo">
                        ›
                    </button>
                    <div className="carousel-dots" data-carousel-dots role="tablist" aria-label="Slide indicators"></div>
                </div>

                <p className="weekly">7–10pm every Thursday at the Veteran's Memorial Club.</p>

                <section className="upcoming-section" aria-labelledby="upcoming-heading">
                    <h2 className="section-heading" id="upcoming-heading">
                        Upcoming events
                    </h2>
                    <p className="upcoming-loading" id="upcoming-events-loading">
                        Loading events…
                    </p>
                    <ul className="upcoming-list" id="upcoming-events-list"></ul>
                    <p className="upcoming-more">
                        <a href="/calendar/">Full calendar →</a>
                    </p>
                </section>

                <section className="teaser teaser-learning" aria-labelledby="learning-teaser-heading">
                    <h2 className="section-heading" id="learning-teaser-heading">
                        Learn with Dylan
                    </h2>
                    <p>
                        Dylan explores partner styles from Lindy Hop to blues to tango and contact improv, and teaches fusion built
                        around connection and presence. Open to travel for teaching and DJ sets.
                    </p>
                    <a className="btn" href="/learning/">
                        Lessons &amp; teaching
                    </a>
                </section>

                <div className="contribution-cta">
                    <h2 className="section-heading">Want to connect</h2>
                    <p>
                        Email <a href={`mailto:${site.email}`}>{site.email}</a> to tell us more.
                    </p>
                </div>

                <Footer />
            </div>

            <EventModal />
        </Base>
    );
}

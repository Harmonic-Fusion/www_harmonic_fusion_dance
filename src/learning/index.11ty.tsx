import { Base } from "../_includes/components/Base.tsx";
import { Footer } from "../_includes/components/Footer.tsx";
import { site } from "../_includes/site.ts";

const BOOKING_URL =
    "https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1rLoCJNlJWCvL9K1e7bvX05wxb17GhIIoFhizJPwWuRq4D3I14T_Xh6Pa-2QEcCFWko23X09Bs";

function External({ href, children }: { href: string; children: string }) {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
        </a>
    );
}

export default function Learning() {
    return (
        <Base
            title="Learning | Harmonic Fusion"
            description="Private dance lessons and traveling teaching with Dylan — fusion, blues, Lindy Hop, West Coast Swing, and more."
            stylesheets={["/site.css", "/learning.css"]}
            nav={{ current: "learning" }}
            scripts={["site"]}
        >
            <div className="container">
                <header className="page-header">
                    <h1>Learning</h1>
                    <p className="lede">Lessons, teaching, and travel — curiosity and connection over rigid patterns.</p>
                </header>

                <section className="learning-section" aria-labelledby="bio-heading">
                    <h2 id="bio-heading">Bio</h2>
                    <figure className="bio-photo">
                        <img src="/images/eugene/web/DSC_7991.jpg" alt="Dylan teaching and dancing" width="400" height="586" loading="lazy" />
                    </figure>
                    <p>
                        Dylan loves exploring the multitude of dance styles and sharing what he learns from each. From Lindy Hop to
                        blues to tango to contact improv and more, he's studied many kinds of partner dancing and thinks deeply about
                        what makes them similar or unique. He feels at home with fusion dancers who also love to recombine dance
                        elements in new ways while focusing on the connection and presence.
                    </p>
                    <p>
                        Dylan has been teaching partner dance since 2018, following a 2016 return to dance through blues and Lindy
                        Hop and a 2017 discovery of fusion. He teaches across blues, West Coast Swing, Lindy Hop, contact improv,
                        salsa, bachata, tango, and other styles. He co-founded Unity Fusion, a monthly fusion event in Eugene, Oregon
                        running since 2023, and hosts a weekly fusion event called Harmonic Fusion since January 2026.
                    </p>
                    <p>
                        His teaching treats lead and follow roles as another dimension to be chosen within dance. Along with
                        dimensions like stretch/compression, frame, pulse, musicality, and more, he teaches ways to think about dance
                        connection beyond a specific sequence of steps — teaching built for curiosity and connection over rigid
                        patterns.
                    </p>
                </section>

                <section className="learning-section" aria-labelledby="lessons-heading">
                    <h2 id="lessons-heading">Private lessons</h2>
                    <p>
                        We'll look at where your dancing is now, what you want from it, and how to get there — working in fusion,
                        micro fusion, blues, Lindy Hop, West Coast Swing, or whatever you're chasing. Most dancers already have a
                        strength they haven't learned to aim yet, and that's usually where we start. Solo or couples welcome; no
                        partner needed.
                    </p>

                    <h3 className="section-heading" style={{ fontSize: "1.125rem", margin: "1.5rem 0 0.75rem" }}>
                        Styles taught
                    </h3>
                    <ul className="styles-list">
                        <li>
                            <strong>Fusion</strong> (primary) — accessible partner dance foundations
                        </li>
                        <li>Micro Fusion, Blues, West Coast Swing, Lindy Hop, Balboa, Bachata</li>
                        <li>All-levels format: simple to grasp, rewarding for experienced dancers</li>
                    </ul>

                    <div className="cta-block">
                        <a className="btn" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                            Book a time
                        </a>
                    </div>
                    <p className="email-note">
                        Or email <a href={`mailto:${site.email}`}>{site.email}</a>
                    </p>
                </section>

                <section className="learning-section" aria-labelledby="teaching-history-heading">
                    <h2 id="teaching-history-heading">Teaching history &amp; travel</h2>
                    <p>
                        Open to travel for teaching and DJ sets (fusion, blues, Lindy Hop). Recent workshops, ongoing events, and
                        organizing experience:
                    </p>

                    <ul className="experience-list">
                        <li>
                            <strong>Coalescence Summer Celebration</strong> — Vancouver, BC (Aug 2, 2025). Teaching &amp; DJ.
                        </li>
                        <li>
                            <strong>Squamish Fusion Festival 2026</strong> — Squamish, BC. Teaching &amp; DJ.
                        </li>
                        <li>
                            <strong>Unity Fusion</strong> Co-founder and instructor coordinator — monthly fusion event, Eugene, OR
                            (2023–present). <External href="https://unityfusiondance.com">unityfusiondance.com</External>
                        </li>
                        <li>
                            <strong>Harmonic Fusion</strong> Organizer and instructor — weekly events, Eugene, OR.{" "}
                            <a href="https://www.harmonicfusion.dance">www.harmonicfusion.dance</a>
                        </li>
                        <li>
                            <strong>Make Every Dance Amazing</strong> Instructor, weekender (Aug 2025) and teacher training
                            workshops. <External href="https://unityfusiondance.com/amazing">unityfusiondance.com/amazing</External>
                        </li>
                        <li>
                            <strong>Breitenbush Fusion Immersion</strong> Instructor (Sep 2025, Apr 2026).{" "}
                            <External href="https://www.fusionimmersion.net">fusionimmersion.net</External>
                        </li>
                        <li>
                            <strong>Salt and Sage Fusion</strong> Instructor — monthly event hosted in Salt Lake City, UT.
                        </li>
                        <li>
                            <strong>Weekenders &amp; travel</strong> Attendee at 16+ weekenders across styles, including
                            international events in Portugal and Greece.
                        </li>
                    </ul>

                    <div className="cta-block" style={{ marginTop: "2rem" }}>
                        <a className="btn" href={`mailto:${site.email}?subject=Teaching%20or%20DJ%20inquiry`}>
                            Get in touch
                        </a>
                    </div>
                </section>

                <Footer />
            </div>
        </Base>
    );
}

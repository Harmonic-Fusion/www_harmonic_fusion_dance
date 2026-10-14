import { Base } from "../_includes/components/Base.tsx";
import { Comments } from "../_includes/components/Comments.tsx";

const FONTS =
    "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Big+Shoulders+Display:wght@700;800&family=IBM+Plex+Mono:wght@400;500&display=swap";

const SOURCES: [string, string][] = [
    ["https://en.wikipedia.org/wiki/Blues_dance", "Blues dance – Wikipedia"],
    ["https://spurlock.illinois.edu/exhibits/online/blues/styles.html", "Blues Dance Styles – Spurlock Museum"],
    ["https://www.spurlock.illinois.edu/exhibits/online/blues/characteristics.html", "Blues Dance Characteristics – Spurlock Museum"],
    ["https://en.wikipedia.org/wiki/Fusion_dance", "Fusion dance – Wikipedia"],
    ["https://archive.cascadebluesassociation.org/?p=15295", "Saved by the Blues – Cascade Blues Association"],
    ["https://coloradosun.com/2018/09/17/colorado-blues-dancing-denver/", "Colorado blues dancing – Colorado Sun"],
    [
        "https://www.movinginmeasure.com/dancing-their-blues-away-in-sweet-home-chicago/",
        "Dancing Their Blues Away in Sweet Home Chicago – Moving in Measure",
    ],
];

export default function History() {
    return (
        <Base
            title="History | Harmonic Fusion"
            description="A family tree of partner dance — African, European, Latin, swing, blues, and fusion lineages."
            head={
                <>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                </>
            }
            stylesheets={[FONTS, "/site.css", "/history/history.css"]}
            nav={{ current: "history" }}
            bodyClass="history-page"
            scripts={["history"]}
        >
            <header className="history-header">
                <h1>History of dance</h1>
                <p>
                    Partner dances share a long history. This map traces where they come from: rhythm and body from African dance,
                    the couple embrace from European dance, and the styles — including blues and fusion — that grew from both.
                </p>
            </header>

            <div className="lineage">
                <div className="wrap">
                    <header>
                        <div className="eyebrow">A family tree of partner dance</div>
                        <h1>Partner Dance Lineage</h1>
                        <p className="lede">
                            Most partner dances take their <strong>rhythm and body from African dance</strong> and their{" "}
                            <strong>embrace from European dance</strong>. Latin dances add <strong>Iberian</strong> and often{" "}
                            <strong>Indigenous</strong> roots, flamenco adds <strong>Roma</strong> tradition, and{" "}
                            <strong>contact improv</strong> and <strong>5Rhythms</strong> join through fusion. Select a dance to
                            trace its lineage.
                        </p>
                        <div className="legend" id="legend" aria-label="Family colors"></div>
                        <div className="legend" id="legend2" aria-label="Root dots, arrows and tags"></div>
                        <div className="chips" id="filter" role="group" aria-label="Focus on a family">
                            <span className="lbl">Focus</span>
                        </div>
                        <div className="chips" id="jump" role="group" aria-label="Jump to your styles">
                            <span className="lbl">Your styles</span>
                        </div>
                    </header>

                    <main>
                        <div className="stage">
                            <div className="graph-box" id="box" aria-label="Dance lineage graph">
                                <svg id="svg" xmlns="http://www.w3.org/2000/svg"></svg>
                            </div>
                            <div className="zoom" role="group" aria-label="Zoom">
                                <button type="button" id="zoom-out" aria-label="Zoom out">
                                    −
                                </button>
                                <button type="button" id="zoom-fit">
                                    Fit
                                </button>
                                <button type="button" id="zoom-in" aria-label="Zoom in">
                                    +
                                </button>
                            </div>
                            <p className="hint" id="hint">
                                Rows run from earliest at the top to today at the bottom; dates are approximate. Drag or scroll to
                                move around.
                            </p>
                        </div>

                        <aside className="panel collapsed" id="panel" aria-live="polite">
                            <div className="panel-head">
                                <div className="meta">
                                    <div className="fam" id="p-fam"></div>
                                    <h2 id="p-name"></h2>
                                </div>
                                <button type="button" className="toggle" id="p-toggle" aria-expanded="false">
                                    Details
                                </button>
                            </div>
                            <div className="panel-body" id="p-body"></div>
                        </aside>
                    </main>

                    <footer>
                        <p>
                            Solid arrows are direct lineage. Dashed arrows are an influence or a link historians still debate.
                            Colored dots on each dance show which root groups it traces back to. In a focused view, faded boxes
                            come from other families and are shown for context.
                        </p>
                        <div className="sources">
                            <b>Sources</b>
                            <ul>
                                {SOURCES.map(([href, label]) => (
                                    <li key={href}>
                                        <a href={href} target="_blank" rel="noopener">
                                            {label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </footer>
                </div>
            </div>

            <Comments
                style={{ maxWidth: "92ch", margin: "3rem auto 2rem", padding: "0 1rem" }}
                headingStyle={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.75rem", marginBottom: "1rem" }}
            />
        </Base>
    );
}

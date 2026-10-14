import type { CSSProperties } from "react";

// Remark42 mount point. Stays hidden until initRemark (src/scripts/lib/config.ts) loads the widget.
export function Comments({ style, headingStyle }: { style?: CSSProperties; headingStyle?: CSSProperties }) {
    return (
        <section className="comments" id="comments" aria-label="Comments" hidden style={style}>
            <h2 style={headingStyle}>Comments</h2>
            <div id="remark42"></div>
        </section>
    );
}

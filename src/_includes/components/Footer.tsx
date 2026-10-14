import { Fragment, type ReactNode } from "react";
import { site } from "../site.ts";

const DEFAULT_LINKS: [string, ReactNode][] = [
    [site.downloadsUrl, "Downloads"],
    ["/terms.html", "Terms & Liability"],
];

export function Footer({ links = DEFAULT_LINKS }: { links?: [string, ReactNode][] }) {
    return (
        <div className="page-footer">
            {links.map(([href, label], i) => (
                <Fragment key={href}>
                    {i > 0 && <span className="sep">|</span>}
                    <a href={href}>{label}</a>
                </Fragment>
            ))}
        </div>
    );
}

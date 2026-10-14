import type { ReactNode } from "react";
import { assetUrl } from "../asset.ts";
import { Head, type HeadProps } from "./Head.tsx";
import { Nav, type NavProps } from "./Nav.tsx";

export interface BaseProps extends Omit<HeadProps, "children"> {
    /** Main nav. Pass false for standalone pages (terms, QR, style guide). */
    nav?: NavProps | false;
    bodyClass?: string;
    /** Bundles from src/scripts/pages, by name (e.g. "home" → /js/home.js). */
    scripts?: string[];
    /** Script URLs loaded before the bundles (e.g. CDN libraries). */
    externalScripts?: string[];
    head?: ReactNode;
    children: ReactNode;
}

export function Base({ nav = {}, bodyClass, scripts = [], externalScripts = [], head, children, ...headProps }: BaseProps) {
    return (
        <html lang="en">
            <Head {...headProps}>{head}</Head>
            <body className={bodyClass}>
                {nav && <Nav {...nav} />}
                {children}
                {externalScripts.map((src) => (
                    <script key={src} src={src}></script>
                ))}
                {scripts.map((name) => (
                    <script key={name} src={assetUrl(`/js/${name}.js`)}></script>
                ))}
            </body>
        </html>
    );
}

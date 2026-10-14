import type { ReactNode } from "react";
import { assetUrl } from "../asset.ts";
import { site } from "../site.ts";

const ICON_SIZES = [16, 32, 64, 96, 128, 256, 512];

export interface HeadProps {
    title: string;
    description?: string;
    robots?: string;
    /** Set false for a single theme-color instead of the light/dark pair. */
    themeColorScheme?: boolean;
    analytics?: boolean;
    stylesheets?: string[];
    jsonLd?: object;
    children?: ReactNode;
}

function Analytics() {
    const init = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${site.gtagId}');
    `;
    return (
        <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${site.gtagId}`}></script>
            <script dangerouslySetInnerHTML={{ __html: init }} />
        </>
    );
}

function Icons() {
    return (
        <>
            <link rel="icon" type="image/x-icon" href="/favicon.ico" />
            {(["dark", "light"] as const).map((scheme) =>
                ICON_SIZES.map((size) => (
                    <link
                        key={`${scheme}-${size}`}
                        rel="icon"
                        type="image/png"
                        sizes={`${size}x${size}`}
                        href={`/icons/${scheme}/icon-${size}.png`}
                        media={`(prefers-color-scheme: ${scheme})`}
                    />
                ))
            )}
            <link rel="icon" type="image/png" sizes="16x16" href="/icons/dark/icon-16.png" />
            <link rel="icon" type="image/png" sizes="32x32" href="/icons/dark/icon-32.png" />
            <link rel="apple-touch-icon" sizes="180x180" href="/icons/dark/icon-256.png" />
            <link rel="manifest" href="/manifest.json" />
        </>
    );
}

export function Head({
    title,
    description,
    robots,
    themeColorScheme = true,
    analytics = true,
    stylesheets = [],
    jsonLd,
    children,
}: HeadProps) {
    return (
        <head>
            <meta charSet="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            {description && <meta name="description" content={description} />}
            {robots && <meta name="robots" content={robots} />}
            {themeColorScheme ? (
                <>
                    <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
                    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
                </>
            ) : (
                <meta name="theme-color" content="#000000" />
            )}
            <Icons />
            {analytics && <Analytics />}
            <title>{title}</title>
            {children}
            {stylesheets.map((href) => (
                <link key={href} rel="stylesheet" href={href.startsWith("/") ? assetUrl(href) : href} />
            ))}
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd, null, 2) }}
                />
            )}
        </head>
    );
}

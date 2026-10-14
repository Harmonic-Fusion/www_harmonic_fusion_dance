// Old URL: redirects to /learning/.
export default function Lessons() {
    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta httpEquiv="refresh" content="0; url=/learning/" />
                <link rel="canonical" href="/learning/" />
                <title>Redirecting to Learning…</title>
                <script dangerouslySetInnerHTML={{ __html: "location.replace('/learning/');" }} />
            </head>
            <body>
                <p>
                    This page has moved to <a href="/learning/">Learning</a>.
                </p>
            </body>
        </html>
    );
}

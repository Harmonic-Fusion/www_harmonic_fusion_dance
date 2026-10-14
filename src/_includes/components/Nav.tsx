export type NavSection = "home" | "learning" | "calendar" | "blog" | "history";

const LINKS: { id: NavSection; href: string; label: string }[] = [
    { id: "home", href: "/", label: "Eugene Blues Fusion" },
    { id: "learning", href: "/learning/", label: "Learning" },
    { id: "calendar", href: "/calendar/", label: "Calendar" },
    { id: "blog", href: "/blog/", label: "Blog" },
    { id: "history", href: "/history/", label: "History" },
];

export interface NavProps {
    current?: NavSection;
    hide?: NavSection[];
}

export function Nav({ current, hide = [] }: NavProps) {
    return (
        <nav className="site-nav" aria-label="Main">
            <div className="site-nav-inner">
                <a className="site-nav-brand" href="/">
                    Harmonic Fusion
                </a>
                <button
                    type="button"
                    className="site-nav-toggle"
                    aria-expanded="false"
                    aria-controls="site-nav-menu"
                    aria-label="Open menu"
                >
                    <span className="site-nav-toggle-bars" aria-hidden="true"></span>
                </button>
                <ul className="site-nav-links" id="site-nav-menu">
                    {LINKS.filter((link) => !hide.includes(link.id)).map((link) => {
                        const active = link.id === current;
                        return (
                            <li key={link.id}>
                                <a
                                    href={link.href}
                                    className={active ? "active" : undefined}
                                    aria-current={active ? "page" : undefined}
                                >
                                    {link.label}
                                </a>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
}

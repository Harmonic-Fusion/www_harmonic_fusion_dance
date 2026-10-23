// Site-wide config (public calendar and Remark42 — safe to expose in the client).
export interface RemarkConfig {
    host: string;
    site_id: string;
    url?: string;
    page_title?: string;
    theme?: "light" | "dark";
    locale?: string;
    show_email_subscription?: boolean;
    show_rss_subscription?: boolean;
    show_telegram_subscription?: boolean;
    simple_view?: boolean;
    no_footer?: boolean;
    components?: string[];
    max_shallow_level?: number;
    counter?: boolean;
    vote?: string;
    emoji?: boolean;
    /** CSS variables applied inside the Remark42 iframe. Dark theme reads the numbered tokens. */
    custom_properties?: Record<string, string>;
}

declare global {
    interface Window {
        remark_config?: RemarkConfig;
    }
}

export const SITE_CONFIG = {
    calendarId: "harmonicfusiondance@gmail.com",
    // Optional: Google Calendar API v3 key (expands recurring events).
    // Leave empty to use the public iCal feed only.
    googleCalendarApiKey: "AIzaSyDG6sIfQdFEPpGuGRupWNXkwRM5fGarY1w",
    remark: {
        host: "https://comments.harmonicfusion.dance",
        site_id: "harmonicfusiondance",
        theme: "dark",
        locale: "en",
        show_email_subscription: false,
        show_rss_subscription: false,
        show_telegram_subscription: false,
        // Drops the markdown toolbar so the composer is a single field and a send button.
        simple_view: true,
        no_footer: true,
        components: ["embed"],
        max_shallow_level: 10,
        counter: true,
        vote: "all",
        emoji: true,
        custom_properties: {
            "--font-family":
                '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
            "--color20": "#e8e8ed",
            "--color10": "#ffffff",
            "--color33": "#f0b56a",
            "--color35": "#8e8e93",
            "--color1": "#a1a1a6",
            "--color11": "#8e8e93",
            "--color9": "#DF9535",
            "--color29": "#DF9535",
            "--color15": "#DF9535",
            "--color7": "#000000",
            "--color8": "#000000",
            "--color5": "#f2f2f4",
            "--color6": "#000000",
            "--color19": "#1a1a1a",
            "--color18": "#2a2a2a",
            "--color36": "rgba(255, 255, 255, 0.16)",
            "--color13": "#8e8e93",
            "--color12": "223, 149, 53",
            "--color30": "196, 92, 92",
            "--color47": "rgba(223, 149, 53, 0.45)",
            "--color42": "rgba(223, 149, 53, 0.28)",
        },
    } satisfies RemarkConfig as RemarkConfig,
};

export function initRemark(page: Partial<RemarkConfig>): void {
    const comments = document.getElementById("comments");
    if (comments) comments.hidden = true;

    const remarkConfig: RemarkConfig = { ...SITE_CONFIG.remark, ...page };
    let host = String(remarkConfig.host || "").replace(/\/$/, "");
    const pageHost = window.location.hostname;
    if (pageHost === "localhost" || pageHost === "127.0.0.1") {
        host = "http://" + pageHost + ":8748";
    }
    remarkConfig.host = host;

    if (!host || !remarkConfig.site_id) return;

    window.remark_config = remarkConfig;

    const components = remarkConfig.components || ["embed"];
    let pending = components.length;
    let failed = false;

    function hideComments() {
        failed = true;
        if (comments) comments.hidden = true;
    }

    function showComments() {
        if (failed) return;
        if (comments) comments.hidden = false;
    }

    components.forEach((name) => {
        const script = document.createElement("script");
        script.type = "module";
        script.async = true;
        script.defer = true;
        script.src = host + "/web/" + name + ".mjs";
        script.onload = () => {
            pending -= 1;
            if (pending === 0) showComments();
        };
        script.onerror = hideComments;
        (document.head || document.body).appendChild(script);
    });
}

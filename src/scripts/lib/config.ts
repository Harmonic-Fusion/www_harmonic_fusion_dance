// Site-wide config (public calendar and Remark42 — safe to expose in the client).
export interface RemarkConfig {
    host: string;
    site_id: string;
    url?: string;
    page_title?: string;
    theme?: "light" | "dark";
    locale?: string;
    show_email?: boolean;
    simple_view?: boolean;
    components?: string[];
    max_shallow_level?: number;
    counter?: boolean;
    vote?: string;
    emoji?: boolean;
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
        show_email: false,
        simple_view: false,
        components: ["embed"],
        max_shallow_level: 10,
        counter: true,
        vote: "all",
        emoji: true,
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

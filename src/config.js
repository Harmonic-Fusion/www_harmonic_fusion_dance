// Site-wide config (public calendar and Remark42 — safe to expose in the client).
window.SITE_CONFIG = {
    calendarId: 'harmonicfusiondance@gmail.com',
    // Optional: Google Calendar API v3 key (expands recurring events).
    // Leave empty to use the public iCal feed only.
    googleCalendarApiKey: 'AIzaSyDG6sIfQdFEPpGuGRupWNXkwRM5fGarY1w',
    remark: {
        host: 'https://comments.harmonicfusion.dance',
        site_id: 'harmonicfusiondance',
        theme: 'light',
        locale: 'en',
        show_email: false,
        simple_view: false,
        components: ['embed'],
        max_shallow_level: 10,
        counter: true,
        vote: 'all',
        emoji: true
    }
};

window.initRemark = function (page) {
    var defaults = window.SITE_CONFIG.remark;
    var remarkConfig = Object.assign({}, defaults, page);
    var host = remarkConfig.host;

    (function (c, l, a, m, e, n, t) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        t = l.createElement(m);
        t.async = 1;
        t.src = e;
        n = l.getElementsByTagName(m)[0];
        n.parentNode.insertBefore(t, n);
    })(window, document, 'REMARK42', 'script', host + '/web/client.js');

    var checkLoaded = setInterval(function () {
        if (window.REMARK42 && typeof window.REMARK42.init === 'function') {
            clearInterval(checkLoaded);
            window.REMARK42.init(remarkConfig);
            window.REMARK42.embed();
        }
    }, 100);
};

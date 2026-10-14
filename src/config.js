// Site-wide config (public calendar and Remark42 — safe to expose in the client).
window.SITE_CONFIG = {
    calendarId: 'harmonicfusiondance@gmail.com',
    // Optional: Google Calendar API v3 key (expands recurring events).
    // Leave empty to use the public iCal feed only.
    googleCalendarApiKey: 'AIzaSyDG6sIfQdFEPpGuGRupWNXkwRM5fGarY1w',
    remark: {
        host: 'https://comments.harmonicfusion.dance',
        site_id: 'harmonicfusiondance',
        theme: 'dark',
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
    var comments = document.getElementById('comments');
    if (comments) comments.hidden = true;

    var defaults = (window.SITE_CONFIG && window.SITE_CONFIG.remark) || {};
    var remarkConfig = Object.assign({}, defaults, page);
    var host = String(remarkConfig.host || '').replace(/\/$/, '');
    var pageHost = window.location.hostname;
    if (pageHost === 'localhost' || pageHost === '127.0.0.1') {
        host = 'http://' + pageHost + ':8748';
    }
    remarkConfig.host = host;

    if (!host || !remarkConfig.site_id) return;

    window.remark_config = remarkConfig;

    var components = remarkConfig.components || ['embed'];
    var pending = components.length;
    var failed = false;

    function hideComments() {
        failed = true;
        if (comments) comments.hidden = true;
    }

    function showComments() {
        if (failed) return;
        if (comments) comments.hidden = false;
    }

    components.forEach(function (name) {
        var script = document.createElement('script');
        script.type = 'module';
        script.async = true;
        script.defer = true;
        script.src = host + '/web/' + name + '.mjs';
        script.onload = function () {
            pending -= 1;
            if (pending === 0) showComments();
        };
        script.onerror = hideComments;
        (document.head || document.body).appendChild(script);
    });
};

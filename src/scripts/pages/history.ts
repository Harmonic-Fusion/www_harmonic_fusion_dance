// Partner dance lineage graph. Edit the dances in src/history/lineage.json.
import lineage from "../../history/lineage.json";
import { initRemark } from "../lib/config.ts";
import { requireElement } from "../lib/dom.ts";
import { initNav } from "../lib/nav.ts";

initNav();

type EdgeKind = "solid" | "dashed";

interface DanceNode {
    id: string;
    short: string;
    name: string;
    years: string;
    place: string;
    fam: string;
    root?: boolean;
    form?: string;
    t: number;
    lane: number;
    p: [string, EdgeKind][];
    summary: string;
    look?: string;
    note?: string;
    // Graph structure
    kids: Edge[];
    parents: Edge[];
    w: number;
    h: number;
    roots: string[];
    groups: string[];
    // Layout
    col0: number;
    c: number;
    r: number;
    x: number;
    y: number;
    el: SVGGElement | null;
}

interface Edge {
    from: DanceNode;
    to: DanceNode;
    kind: EdgeKind;
    route?: "direct" | "channel";
    gap?: number;
    chX?: number;
    sx: number;
    ex: number;
    d: string;
    el: SVGPathElement;
}

interface LineageDance {
    id: string;
    short: string;
    name: string;
    years: string;
    place: string;
    family: string;
    root?: boolean;
    form?: string;
    row: number;
    lane: number;
    parents?: { id: string; kind: string }[];
    summary: string;
    look?: string;
    note?: string;
}

const data = lineage as {
    families: { id: string; label: string }[];
    rootGroups: { id: string; label: string; roots: string[] }[];
    styles: { id: string; label: string }[];
    dances: LineageDance[];
};

const FAMILIES: Record<string, string> = Object.fromEntries(data.families.map((family) => [family.id, family.label]));
const GROUP_LABEL: Record<string, string> = Object.fromEntries(data.rootGroups.map((group) => [group.id, group.label]));
const ROOT_GROUP: Record<string, string> = {};
for (const group of data.rootGroups) for (const id of group.roots) ROOT_GROUP[id] = group.id;
const ASKED: [string, string][] = data.styles.map((style) => [style.id, style.label]);
const edgeKind: Record<string, EdgeKind> = { lineage: "solid", influence: "dashed", solid: "solid", dashed: "dashed" };

const NW = 160,
    NH = 50,
    PITCH = 184,
    ROWH = 100,
    MX = 48,
    MY = 34;

const NODES: DanceNode[] = data.dances.map((dance) => ({
    id: dance.id,
    short: dance.short,
    name: dance.name,
    years: dance.years,
    place: dance.place,
    fam: dance.family,
    ...(dance.root ? { root: true } : {}),
    ...(dance.form ? { form: dance.form } : {}),
    t: dance.row,
    lane: dance.lane,
    p: (dance.parents || []).map((parent): [string, EdgeKind] => [parent.id, edgeKind[parent.kind] || (parent.kind as EdgeKind)]),
    summary: dance.summary,
    ...(dance.look ? { look: dance.look } : {}),
    ...(dance.note ? { note: dance.note } : {}),
    kids: [],
    parents: [],
    w: NW,
    h: NH,
    roots: [],
    groups: [],
    col0: 0,
    c: 0,
    r: 0,
    x: 0,
    y: 0,
    el: null,
}));

const byId: Record<string, DanceNode> = Object.fromEntries(NODES.map((n) => [n.id, n]));
const svgNS = "http://www.w3.org/2000/svg";
const famVar = (f: string) => `var(--f-${f})`;
const esc = (s: unknown) =>
    String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);

/* graph structure */
const EDGES: Edge[] = [];
for (const n of NODES)
    for (const [pid, kind] of n.p) {
        const e = { from: byId[pid], to: n, kind } as Edge;
        EDGES.push(e);
        n.parents.push(e);
        byId[pid].kids.push(e);
    }
function walk(start: DanceNode, dir: "up" | "down"): Set<DanceNode> {
    const seen = new Set<DanceNode>(),
        stack = [start];
    while (stack.length) {
        const n = stack.pop()!;
        for (const e of dir === "up" ? n.parents : n.kids) {
            const m = dir === "up" ? e.from : e.to;
            if (!seen.has(m)) {
                seen.add(m);
                stack.push(m);
            }
        }
    }
    return seen;
}
for (const n of NODES) {
    const up = walk(n, "up");
    n.roots = Object.keys(ROOT_GROUP).filter((r) => r === n.id || up.has(byId[r]));
    n.groups = [...new Set(n.roots.map((r) => ROOT_GROUP[r]))];
}

/* layout: rows by time, columns packed by lane, unused columns removed */
let VIS = new Set(NODES),
    VEDGES = EDGES,
    GW = 0,
    GH = 0;
function layout(vis: Set<DanceNode>) {
    const ns = NODES.filter((n) => vis.has(n));
    const ts = [...new Set(ns.map((n) => n.t))].sort((a, b) => a - b);
    const rowOf = new Map(ts.map((t, i) => [t, i]));
    const used = new Set<number>();
    for (const t of ts) {
        let prev = -Infinity;
        ns.filter((n) => n.t === t)
            .sort((a, b) => a.lane - b.lane)
            .forEach((n) => {
                n.col0 = Math.max(Math.round(n.lane), prev + 1);
                prev = n.col0;
                used.add(n.col0);
            });
    }
    const cols = [...used].sort((a, b) => a - b),
        colOf = new Map(cols.map((c, i) => [c, i]));
    for (const n of ns) {
        n.c = colOf.get(n.col0)!;
        n.r = rowOf.get(n.t)!;
        n.x = MX + NW / 2 + n.c * PITCH;
        n.y = MY + NH / 2 + n.r * ROWH;
    }
    GW = Math.ceil(MX * 2 + NW + (cols.length - 1) * PITCH);
    GH = Math.ceil(MY * 2 + NH + (ts.length - 1) * ROWH);
    VEDGES = EDGES.filter((e) => vis.has(e.from) && vis.has(e.to));
    route(ns);
}
const nTop = (n: DanceNode) => n.y - n.h / 2,
    nBot = (n: DanceNode) => n.y + n.h / 2;
const gapX = (g: number) => MX + NW / 2 + (g - 0.5) * PITCH;
function cubicPts(x0: number, y0: number, x1: number, y1: number, steps = 24): [number, number][] {
    const pts: [number, number][] = [],
        d = (y1 - y0) / 2;
    for (let i = 1; i < steps; i++) {
        const t = i / steps,
            mt = 1 - t;
        pts.push([
            mt * mt * mt * x0 + 3 * mt * mt * t * x0 + 3 * mt * t * t * x1 + t * t * t * x1,
            mt * mt * mt * y0 + 3 * mt * mt * t * (y0 + d) + 3 * mt * t * t * (y1 - d) + t * t * t * y1,
        ]);
    }
    return pts;
}
function route(ns: DanceNode[]) {
    const hits = (pts: [number, number][], skip: DanceNode[]) =>
        pts.some(([x, y]) =>
            ns.some((m) => !skip.includes(m) && Math.abs(x - m.x) < m.w / 2 + 6 && Math.abs(y - m.y) < m.h / 2 + 6)
        );
    for (const e of VEDGES) {
        const u = e.from,
            v = e.to;
        e.chX = undefined;
        if (!hits(cubicPts(u.x, nBot(u), v.x, nTop(v)), [u, v])) {
            e.route = "direct";
            continue;
        }
        const gL = v.c,
            gR = v.c + 1;
        e.route = "channel";
        e.gap = Math.abs(gapX(gL) - u.x) <= Math.abs(gapX(gR) - u.x) ? gL : gR;
    }
    const lanes: Record<number, number> = {};
    for (const e of VEDGES.filter((e) => e.route === "channel").sort((a, b) => a.from.r - b.from.r || a.from.x - b.from.x)) {
        const i = (lanes[e.gap!] = (lanes[e.gap!] ?? -1) + 1);
        e.chX = gapX(e.gap!) + ((i % 5) - 2) * 4.5;
    }
    const key = (e: Edge, end: "out" | "in") => e.chX ?? (end === "out" ? e.to.x : e.from.x);
    for (const n of ns) {
        const outs = n.kids.filter((e) => VEDGES.includes(e)).sort((a, b) => key(a, "out") - key(b, "out"));
        const so = Math.min(n.w - 24, Math.max(0, outs.length - 1) * 14);
        outs.forEach((e, i) => {
            e.sx = outs.length === 1 ? n.x : n.x - so / 2 + (so * i) / (outs.length - 1);
        });
        const ins = n.parents.filter((e) => VEDGES.includes(e)).sort((a, b) => key(a, "in") - key(b, "in"));
        const si = Math.min(n.w - 30, Math.max(0, ins.length - 1) * 14);
        ins.forEach((e, i) => {
            e.ex = ins.length === 1 ? n.x : n.x - si / 2 + (si * i) / (ins.length - 1);
        });
    }
    const f1 = (v: number) => Math.round(v * 10) / 10;
    for (const e of VEDGES) {
        const u = e.from,
            v = e.to,
            sy = nBot(u),
            ey = nTop(v) - 3;
        if (e.route === "direct") {
            const d = (ey - sy) / 2;
            e.d = `M${f1(e.sx)},${sy} C${f1(e.sx)},${f1(sy + d)} ${f1(e.ex)},${f1(ey - d)} ${f1(e.ex)},${ey}`;
        } else {
            const yA = sy + (ROWH - NH) * 0.5,
                yB = nTop(v) - (ROWH - NH) * 0.5,
                x = e.chX!;
            e.d = `M${f1(e.sx)},${sy} C${f1(e.sx)},${f1(sy + 16)} ${f1(x)},${f1(yA - 12)} ${f1(x)},${f1(yA)} L${f1(x)},${f1(yB)} C${f1(x)},${f1(yB + 12)} ${f1(e.ex)},${f1(ey - 14)} ${f1(e.ex)},${ey}`;
        }
    }
}

/* drawing */
const svg = document.getElementById("svg") as unknown as SVGSVGElement;
function el<K extends keyof SVGElementTagNameMap>(
    tag: K,
    attrs: Record<string, string | number> = {},
    parent?: Element
): SVGElementTagNameMap[K] {
    const x = document.createElementNS(svgNS, tag);
    for (const k in attrs) x.setAttribute(k, String(attrs[k]));
    if (parent) parent.appendChild(x);
    return x;
}
let gEdges: SVGGElement,
    filterFam = "all";
function draw() {
    svg.replaceChildren();
    svg.setAttribute("viewBox", `0 0 ${GW} ${GH}`);
    svg.setAttribute("role", "group");
    const defs = el("defs", {}, svg);
    for (const [id, color] of [
        ["m-edge", "var(--edge)"],
        ["m-lit", "var(--fg)"],
        ["m-african", "color-mix(in srgb, var(--f-african) 55%, var(--surface))"],
        ["m-european", "color-mix(in srgb, var(--f-european) 60%, var(--surface))"],
        ["m-other", "color-mix(in srgb, var(--f-other) 55%, var(--surface))"],
        ["m-modern", "color-mix(in srgb, var(--f-modern) 55%, var(--surface))"],
    ]) {
        const m = el(
            "marker",
            {
                id,
                viewBox: "0 0 10 10",
                refX: "8",
                refY: "5",
                markerWidth: "7",
                markerHeight: "7",
                orient: "auto-start-reverse",
                markerUnits: "userSpaceOnUse",
            },
            defs
        );
        el("path", { d: "M0,0 L10,5 L0,10 z" }, m).style.fill = color;
    }
    gEdges = el("g", { "aria-hidden": "true" }, svg);
    for (const e of VEDGES) {
        const cls = ["edge", e.kind === "dashed" ? "dashed" : "", e.from.root ? "from-" + ROOT_GROUP[e.from.id] : ""]
            .filter(Boolean)
            .join(" ");
        e.el = el("path", { d: e.d, class: cls }, gEdges);
    }
    const gNodes = el("g", {}, svg);
    for (const n of NODES) {
        if (!VIS.has(n)) {
            n.el = null;
            continue;
        }
        const ctx = filterFam !== "all" && n.fam !== filterFam;
        const g = el(
            "g",
            {
                class: "node" + (n.root ? " root" : "") + (ctx ? " ctx" : ""),
                transform: `translate(${n.x - n.w / 2},${n.y - n.h / 2})`,
                tabindex: "0",
                role: "button",
                "aria-label": `${n.name}, ${n.years}`,
            },
            gNodes
        );
        g.style.setProperty("--c", famVar(n.fam));
        el("rect", { class: "halo", x: -5, y: -5, width: n.w + 10, height: n.h + 10, rx: 11 }, g);
        el("rect", { class: "box", width: n.w, height: n.h, rx: 7 }, g);
        el("text", { class: "nm", x: 11, y: n.h / 2 - 3 }, g).textContent = n.short;
        el("text", { class: "yr", x: 11, y: n.h / 2 + 12 }, g).textContent = n.years;
        if (n.form || n.root) {
            const tg = el("text", { class: "formtag", x: n.w - 9, y: n.h - 8, "text-anchor": "end" }, g);
            if (n.root) el("tspan", { class: "rootlbl" }, tg).textContent = "ROOT";
            if (n.root && n.form) el("tspan", {}, tg).textContent = " · ";
            if (n.form) el("tspan", {}, tg).textContent = n.form.toUpperCase();
        }
        if (!n.root)
            n.groups.forEach((gr, i) => {
                el("circle", { cx: n.w - 10 - (n.groups.length - 1 - i) * 9, cy: 8, r: 3.2 }, g).style.fill = famVar(gr);
            });
        n.el = g;
        g.addEventListener("click", () => {
            if (dragMoved) return;
            select(n.id, { scroll: false, open: true });
        });
        g.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                select(n.id, { scroll: false, open: true });
            }
        });
    }
}

/* legend, filters, jump chips */
requireElement("legend").insertAdjacentHTML(
    "beforeend",
    `<span class="key">Families</span>` +
        Object.entries(FAMILIES)
            .map(([k, label]) => `<span class="item"><span class="sw" style="--c:${famVar(k)}"></span>${label}</span>`)
            .join("")
);
requireElement("legend2").insertAdjacentHTML(
    "beforeend",
    `<span class="key">Root dots</span>` +
        Object.entries(GROUP_LABEL)
            .map(([k, label]) => `<span class="item"><span class="dot" style="--c:${famVar(k)}"></span>${label}</span>`)
            .join("") +
        `<span class="key">Arrows</span><span class="item"><span class="ln"></span>Lineage</span><span class="item"><span class="ln dashed"></span>Influence or debated</span><span class="key">Tags</span><span class="item"><span class="tag">SOLO</span><span class="tag">GROUP</span>Not a lead-follow couple dance</span>`
);
const filterBox = requireElement("filter");
const FILTERS: [string, string][] = [["all", "All dances"], ...Object.entries(FAMILIES).filter(([k]) => k !== "other")];
for (const [k, label] of FILTERS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.dataset.f = k;
    b.innerHTML = (k === "all" ? "" : `<span class="dot" style="--c:${famVar(k)}"></span>`) + label;
    b.addEventListener("click", () => setFilter(k, true));
    filterBox.appendChild(b);
}
const jump = requireElement("jump");
for (const [id, label] of ASKED) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.dataset.id = id;
    b.innerHTML = `<span class="dot" style="--c:${famVar(byId[id].fam)}"></span>${label}`;
    b.addEventListener("click", () => select(id, { scroll: true, open: true }));
    jump.appendChild(b);
}

/* panel */
const panel = requireElement("panel"),
    toggle = requireElement("p-toggle");
function chipList(edges: Edge[], dir: "up" | "down"): string {
    if (!edges.length)
        return `<div class="none">${dir === "up" ? "A root: nothing earlier in this map." : "Nothing later in this map."}</div>`;
    return `<div class="chips">${edges
        .map((e) => {
            const m = dir === "up" ? e.from : e.to;
            return `<button type="button" class="chip${e.kind === "dashed" ? " dashed" : ""}" data-go="${m.id}" title="${e.kind === "dashed" ? "Influence or debated link" : "Direct lineage"}"><span class="dot" style="--c:${famVar(m.fam)}"></span>${esc(m.name)}</button>`;
        })
        .join("")}</div>`;
}
function renderPanel(n: DanceNode) {
    const fam = requireElement("p-fam");
    fam.style.setProperty("--c", famVar(n.fam));
    fam.innerHTML = `<span class="dot"></span>${esc(FAMILIES[n.fam])}${n.root ? " · root" : ""}`;
    requireElement("p-name").textContent = n.name;
    const pills = [
        n.form ? `<span class="pill">${n.form === "solo" ? "Solo dance" : "Group dance"}</span>` : "",
        ASKED.some(([id]) => id === n.id) ? `<span class="pill">One of your styles</span>` : "",
    ].join("");
    const traces = n.root
        ? `<span class="item"><span class="dot" style="--c:${famVar(ROOT_GROUP[n.id])}"></span>A root of the map</span>`
        : n.roots
              .map(
                  (r) =>
                      `<span class="item"><span class="dot" style="--c:${famVar(ROOT_GROUP[r])}"></span>${esc(byId[r].name)}</span>`
              )
              .join("");
    requireElement("p-body").innerHTML = `
    <div class="when"><span>${esc(n.years)}</span><span>${esc(n.place)}</span></div>
    <div class="sect"><b>${n.root ? "Root" : "Traces back to"}</b><div class="traces">${traces}${pills}</div></div>
    <p>${esc(n.summary)}</p>
    ${n.look ? `<p class="look"><b>Look for</b>${esc(n.look)}</p>` : ""}
    ${n.note ? `<p class="note">${esc(n.note)}</p>` : ""}
    <div class="sect"><b>Comes from</b>${chipList(n.parents, "up")}</div>
    <div class="sect"><b>Leads to</b>${chipList(n.kids, "down")}</div>`;
    document
        .querySelectorAll<HTMLElement>("#p-body [data-go]")
        .forEach((b) => b.addEventListener("click", () => select(b.dataset.go!, { scroll: true, open: true })));
}
function setOpen(open: boolean) {
    panel.classList.toggle("collapsed", !open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Hide" : "Details";
}
toggle.addEventListener("click", () => setOpen(panel.classList.contains("collapsed")));
document.addEventListener("click", (ev) => {
    if (dragMoved || panel.classList.contains("collapsed")) return;
    const target = ev.target as Element;
    if (panel.contains(target)) return;
    if (target.closest(".node") || target.closest("#jump .chip")) return;
    setOpen(false);
});
const narrow = () => window.matchMedia("(max-width: 1000px)").matches;

/* selection */
let current: DanceNode | null = null;
function applySelection() {
    if (!current || !VIS.has(current)) {
        svg.classList.remove("has-sel");
        return;
    }
    const n = current,
        up = walk(n, "up"),
        down = walk(n, "down");
    svg.classList.add("has-sel");
    for (const m of NODES)
        if (m.el) {
            m.el.classList.toggle("sel", m === n);
            m.el.classList.toggle("lit", up.has(m) || down.has(m));
        }
    for (const e of VEDGES) {
        const lit =
            ((e.to === n || up.has(e.to)) && up.has(e.from)) || ((e.from === n || down.has(e.from)) && down.has(e.to));
        e.el.classList.toggle("lit", lit);
        if (lit) gEdges.appendChild(e.el);
    }
}
function select(id: string, { scroll, open }: { scroll: boolean; open: boolean }) {
    const n = byId[id];
    if (!n) return;
    if (!VIS.has(n)) setFilter("all", false);
    current = n;
    applySelection();
    document.querySelectorAll<HTMLElement>("#jump .chip").forEach((b) => b.classList.toggle("on", b.dataset.id === id));
    renderPanel(n);
    if (open) setOpen(true);
    else if (narrow()) setOpen(false);
    if (scroll) centerOn(n);
    try {
        history.replaceState(null, "", "#" + id);
    } catch {
        /* ignore */
    }
}
function setFilter(k: string, recenter: boolean) {
    filterFam = k;
    if (k === "all") VIS = new Set(NODES);
    else {
        const core = NODES.filter((n) => n.fam === k);
        VIS = new Set(core);
        for (const n of core) {
            for (const e of n.parents) VIS.add(e.from);
            for (const e of n.kids) VIS.add(e.to);
        }
    }
    layout(VIS);
    draw();
    applyZoom(zoom, false);
    document.querySelectorAll<HTMLElement>("#filter .chip").forEach((b) => b.classList.toggle("on", b.dataset.f === k));
    applySelection();
    if (recenter) {
        const focus =
            current && VIS.has(current) && (k === "all" || current.fam === k)
                ? current
                : NODES.filter((n) => VIS.has(n) && (k === "all" || n.fam === k)).sort((a, b) => a.t - b.t)[0];
        if (focus) centerOn(focus, true);
    }
}

/* zoom and pan */
const box = requireElement("box");
let zoom = 1;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function applyZoom(z: number, keepCenter = true) {
    const cx = (box.scrollLeft + box.clientWidth / 2) / zoom,
        cy = (box.scrollTop + box.clientHeight / 2) / zoom;
    zoom = Math.min(1.6, Math.max(0.2, z));
    svg.style.width = GW * zoom + "px";
    svg.style.height = GH * zoom + "px";
    if (keepCenter) {
        box.scrollLeft = cx * zoom - box.clientWidth / 2;
        box.scrollTop = cy * zoom - box.clientHeight / 2;
    }
}
function centerOn(n: DanceNode, instant?: boolean) {
    box.scrollTo({
        left: n.x * zoom - box.clientWidth / 2,
        top: n.y * zoom - box.clientHeight * 0.4,
        behavior: reduceMotion || instant ? "auto" : "smooth",
    });
}
requireElement("zoom-in").addEventListener("click", () => applyZoom(zoom * 1.2));
requireElement("zoom-out").addEventListener("click", () => applyZoom(zoom / 1.2));
requireElement("zoom-fit").addEventListener("click", () => {
    applyZoom(Math.min((box.clientWidth - 4) / GW, (box.clientHeight - 4) / GH), false);
    box.scrollLeft = 0;
    box.scrollTop = 0;
});
let drag: { x: number; y: number; l: number; t: number } | null = null,
    dragMoved = false;
box.addEventListener("pointerdown", (ev) => {
    if (ev.pointerType !== "mouse" || ev.button !== 0) return;
    drag = { x: ev.clientX, y: ev.clientY, l: box.scrollLeft, t: box.scrollTop };
    dragMoved = false;
});
window.addEventListener("pointermove", (ev) => {
    if (!drag) return;
    const dx = ev.clientX - drag.x,
        dy = ev.clientY - drag.y;
    if (!dragMoved && Math.hypot(dx, dy) > 4) {
        dragMoved = true;
        box.classList.add("dragging");
    }
    if (dragMoved) {
        box.scrollLeft = drag.l - dx;
        box.scrollTop = drag.t - dy;
    }
});
window.addEventListener("pointerup", () => {
    drag = null;
    box.classList.remove("dragging");
    setTimeout(() => {
        dragMoved = false;
    }, 0);
});
svg.addEventListener("click", (ev) => {
    if (dragMoved || (ev.target as Element).closest(".node")) return;
    current = null;
    svg.classList.remove("has-sel");
    NODES.forEach((m) => m.el && m.el.classList.remove("sel", "lit"));
    VEDGES.forEach((e) => e.el.classList.remove("lit"));
    document.querySelectorAll("#jump .chip").forEach((b) => b.classList.remove("on"));
});

/* start */
zoom = narrow() ? 0.8 : 1;
setFilter("all", false);
const startId = byId[location.hash.slice(1)] ? location.hash.slice(1) : "lindy";
select(startId, { scroll: false, open: false });
requestAnimationFrame(() => centerOn(byId[startId], true));

initRemark({
    url: location.origin + "/history/",
    page_title: "History of dance",
});

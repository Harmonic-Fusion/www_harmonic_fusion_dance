import { requireElement } from "../lib/dom.ts";

// qr-code-styling is loaded from a CDN script tag (see src/qr/index.11ty.tsx).
interface QrOptions {
    width?: number;
    height?: number;
    margin?: number;
    backgroundOptions?: { color?: string };
    [key: string]: unknown;
}

interface QrCode {
    applyExtension(extension: (svg: SVGSVGElement, options: QrOptions) => void): void;
    append(container: HTMLElement): void;
    update(options: QrOptions): void;
    getRawData(extension: "svg" | "png"): Promise<Blob | null>;
}

declare const QRCodeStyling: (new (options: QrOptions) => QrCode) | undefined;

interface Settings {
    size: number;
    margin: number;
    ec: string;
    fg: string;
    bg: string;
    dots: string;
    cornerSquare: string;
    cornerDot: string;
    radius: number;
    logoWidth: number;
    logoHeight: number;
    format: string;
}

const MAX_BYTES = 2953;
const SVG_NS = "http://www.w3.org/2000/svg";

const DEFAULTS: Settings = {
    size: 300,
    margin: 10,
    ec: "Q",
    fg: "#000000",
    bg: "#ffffff",
    dots: "square",
    cornerSquare: "square",
    cornerDot: "square",
    radius: 0,
    logoWidth: 0,
    logoHeight: 0,
    format: "png",
};

const PARAM_KEYS: Record<keyof Settings, string> = {
    size: "size",
    margin: "margin",
    ec: "ec",
    fg: "fg",
    bg: "bg",
    dots: "dots",
    cornerSquare: "cs",
    cornerDot: "cd",
    radius: "radius",
    logoWidth: "logoW",
    logoHeight: "logoH",
    format: "format",
};

const DOT_STYLES = ["square", "dots", "rounded", "extra-rounded", "classy", "classy-rounded"];
const CORNER_SQUARE_STYLES = ["square", "dot", "rounded", "extra-rounded", "dots", "classy", "classy-rounded"];
const CORNER_DOT_STYLES = ["square", "dot", "rounded", "dots", "classy", "classy-rounded", "extra-rounded"];
const EC_LEVELS = ["L", "M", "Q", "H"];
const FORMATS = ["png", "svg"];

const input = requireElement<HTMLInputElement>;
const select = requireElement<HTMLSelectElement>;

const dataInput = requireElement<HTMLTextAreaElement>("qr-data");
const sizeRange = input("qr-size");
const sizeNumber = input("qr-size-number");
const marginRange = input("qr-margin");
const marginNumber = input("qr-margin-number");
const errorCorrection = select("qr-error-correction");
const foreground = input("qr-foreground");
const background = input("qr-background");
const dotsStyle = select("qr-dots-style");
const cornerSquareStyle = select("qr-corner-square-style");
const cornerDotStyle = select("qr-corner-dot-style");
const radiusRange = input("qr-radius");
const radiusNumber = input("qr-radius-number");
const logoWidthRange = input("qr-logo-width");
const logoWidthNumber = input("qr-logo-width-number");
const logoHeightRange = input("qr-logo-height");
const logoHeightNumber = input("qr-logo-height-number");
const downloadFormat = select("qr-download-format");
const preview = requireElement("qr-preview");
const statusEl = requireElement("qr-status");
const charCount = requireElement("char-count");
const downloadBtn = requireElement<HTMLButtonElement>("download-btn");
const copyDataBtn = requireElement<HTMLButtonElement>("copy-data-btn");

let syncingUrl = false;

function utf8ByteLength(str: string): number {
    return new TextEncoder().encode(str).length;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function normalizeColor(value: string | null, fallback: string): string {
    if (typeof value !== "string") {
        return fallback;
    }

    const hex = value.trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(hex)) {
        return hex;
    }
    if (/^#[0-9a-f]{3}$/.test(hex)) {
        return "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    return fallback;
}

function parseIntParam(raw: string | null, fallback: number, min: number, max: number, step: number): number {
    if (raw === null || raw === undefined || String(raw).trim() === "") {
        return fallback;
    }

    let value = Number(raw);
    if (!Number.isFinite(value)) {
        return fallback;
    }
    value = Math.round(value / step) * step;
    return clamp(value, min, max);
}

function oneOf(value: string, allowed: string[], fallback: string): string {
    return allowed.indexOf(value) === -1 ? fallback : value;
}

function getSettings(): Settings {
    return {
        size: Number(sizeRange.value),
        margin: Number(marginRange.value),
        ec: errorCorrection.value,
        fg: normalizeColor(foreground.value, DEFAULTS.fg),
        bg: normalizeColor(background.value, DEFAULTS.bg),
        dots: dotsStyle.value,
        cornerSquare: cornerSquareStyle.value,
        cornerDot: cornerDotStyle.value,
        radius: Number(radiusRange.value),
        logoWidth: Number(logoWidthRange.value),
        logoHeight: Number(logoHeightRange.value),
        format: downloadFormat.value,
    };
}

function setPairValue(rangeEl: HTMLInputElement, numberEl: HTMLInputElement, value: number) {
    rangeEl.value = String(value);
    numberEl.value = String(value);
}

function applySettings(settings: Settings) {
    setPairValue(sizeRange, sizeNumber, settings.size);
    setPairValue(marginRange, marginNumber, settings.margin);
    errorCorrection.value = settings.ec;
    foreground.value = settings.fg;
    background.value = settings.bg;
    dotsStyle.value = settings.dots;
    cornerSquareStyle.value = settings.cornerSquare;
    cornerDotStyle.value = settings.cornerDot;
    setPairValue(radiusRange, radiusNumber, settings.radius);
    setPairValue(logoWidthRange, logoWidthNumber, settings.logoWidth);
    setPairValue(logoHeightRange, logoHeightNumber, settings.logoHeight);
    downloadFormat.value = settings.format;
    updateDependentLimits();
}

function maxLogoDimension(size: number, margin: number): number {
    return Math.max(0, size - margin * 2);
}

function updateDependentLimits() {
    const size = Number(sizeRange.value);
    const margin = Number(marginRange.value);
    const maxRadius = Math.floor(size / 2);
    const maxLogo = maxLogoDimension(size, margin);

    radiusRange.max = String(maxRadius);
    radiusNumber.max = String(maxRadius);
    if (Number(radiusRange.value) > maxRadius) {
        setPairValue(radiusRange, radiusNumber, maxRadius);
    }

    logoWidthRange.max = String(maxLogo);
    logoWidthNumber.max = String(maxLogo);
    logoHeightRange.max = String(maxLogo);
    logoHeightNumber.max = String(maxLogo);

    if (Number(logoWidthRange.value) > maxLogo) {
        setPairValue(logoWidthRange, logoWidthNumber, maxLogo);
    }
    if (Number(logoHeightRange.value) > maxLogo) {
        setPairValue(logoHeightRange, logoHeightNumber, maxLogo);
    }
}

function applySettingsFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const settings: Settings = {
        size: parseIntParam(params.get(PARAM_KEYS.size), DEFAULTS.size, 128, 1024, 1),
        margin: parseIntParam(params.get(PARAM_KEYS.margin), DEFAULTS.margin, 0, 80, 1),
        ec: oneOf((params.get(PARAM_KEYS.ec) || DEFAULTS.ec).toUpperCase(), EC_LEVELS, DEFAULTS.ec),
        fg: normalizeColor(params.get(PARAM_KEYS.fg), DEFAULTS.fg),
        bg: normalizeColor(params.get(PARAM_KEYS.bg), DEFAULTS.bg),
        dots: oneOf(params.get(PARAM_KEYS.dots) || DEFAULTS.dots, DOT_STYLES, DEFAULTS.dots),
        cornerSquare: oneOf(
            params.get(PARAM_KEYS.cornerSquare) || DEFAULTS.cornerSquare,
            CORNER_SQUARE_STYLES,
            DEFAULTS.cornerSquare
        ),
        cornerDot: oneOf(params.get(PARAM_KEYS.cornerDot) || DEFAULTS.cornerDot, CORNER_DOT_STYLES, DEFAULTS.cornerDot),
        radius: DEFAULTS.radius,
        logoWidth: DEFAULTS.logoWidth,
        logoHeight: DEFAULTS.logoHeight,
        format: oneOf((params.get(PARAM_KEYS.format) || DEFAULTS.format).toLowerCase(), FORMATS, DEFAULTS.format),
    };

    const maxRadius = Math.floor(settings.size / 2);
    const maxLogo = maxLogoDimension(settings.size, settings.margin);
    settings.radius = parseIntParam(params.get(PARAM_KEYS.radius), DEFAULTS.radius, 0, maxRadius, 1);
    settings.logoWidth = parseIntParam(params.get(PARAM_KEYS.logoWidth), DEFAULTS.logoWidth, 0, maxLogo, 1);
    settings.logoHeight = parseIntParam(params.get(PARAM_KEYS.logoHeight), DEFAULTS.logoHeight, 0, maxLogo, 1);

    applySettings(settings);
}

function syncUrlFromControls() {
    if (syncingUrl) {
        return;
    }

    const settings = getSettings();
    const params = new URLSearchParams();

    (Object.keys(PARAM_KEYS) as (keyof Settings)[]).forEach((key) => {
        if (String(settings[key]).toLowerCase() !== String(DEFAULTS[key]).toLowerCase()) {
            params.set(PARAM_KEYS[key], String(settings[key]));
        }
    });

    const query = params.toString();
    const nextUrl = window.location.pathname + (query ? "?" + query : "") + window.location.hash;
    const currentUrl = window.location.pathname + window.location.search + window.location.hash;

    if (nextUrl !== currentUrl) {
        syncingUrl = true;
        history.replaceState(null, "", nextUrl);
        syncingUrl = false;
    }
}

function syncPair(rangeEl: HTMLInputElement, numberEl: HTMLInputElement) {
    function fromRange() {
        numberEl.value = rangeEl.value;
        updateQr();
    }

    function fromNumber() {
        const min = Number(numberEl.min);
        const max = Number(numberEl.max);
        const step = Number(numberEl.step) || 1;
        let value = Number(numberEl.value);

        if (Number.isNaN(value)) {
            numberEl.value = rangeEl.value;
            return;
        }

        value = clamp(value, min, max);
        value = Math.round(value / step) * step;
        numberEl.value = String(value);
        rangeEl.value = String(value);
        updateQr();
    }

    rangeEl.addEventListener("input", fromRange);
    numberEl.addEventListener("input", fromNumber);
    numberEl.addEventListener("change", fromNumber);
}

function visualExtension(svg: SVGSVGElement, options: QrOptions) {
    const width = options.width || 0;
    const height = options.height || 0;
    const radius = Number(radiusRange.value) || 0;
    const logoWidth = Number(logoWidthRange.value) || 0;
    const logoHeight = Number(logoHeightRange.value) || 0;
    const bgColor = (options.backgroundOptions && options.backgroundOptions.color) || background.value;

    svg.querySelector("#qr-visual-defs")?.remove();
    svg.querySelector("#qr-logo-space")?.remove();

    const existingGroup = svg.querySelector("#qr-visual-group");
    if (existingGroup) {
        while (existingGroup.firstChild) {
            svg.insertBefore(existingGroup.firstChild, existingGroup);
        }
        existingGroup.remove();
    }

    svg.removeAttribute("clip-path");

    if (radius > 0) {
        const clippedRadius = clamp(radius, 0, Math.floor(Math.min(width, height) / 2));
        const defs = document.createElementNS(SVG_NS, "defs");
        defs.setAttribute("id", "qr-visual-defs");

        const clipPath = document.createElementNS(SVG_NS, "clipPath");
        clipPath.setAttribute("id", "qr-rounded-clip");

        const clipRect = document.createElementNS(SVG_NS, "rect");
        clipRect.setAttribute("x", "0");
        clipRect.setAttribute("y", "0");
        clipRect.setAttribute("width", String(width));
        clipRect.setAttribute("height", String(height));
        clipRect.setAttribute("rx", String(clippedRadius));
        clipRect.setAttribute("ry", String(clippedRadius));
        clipPath.appendChild(clipRect);
        defs.appendChild(clipPath);
        svg.insertBefore(defs, svg.firstChild);

        const group = document.createElementNS(SVG_NS, "g");
        group.setAttribute("id", "qr-visual-group");
        group.setAttribute("clip-path", "url(#qr-rounded-clip)");

        Array.from(svg.childNodes).forEach((node) => {
            if (node === defs) {
                return;
            }
            group.appendChild(node);
        });
        svg.appendChild(group);
    }

    if (logoWidth > 0 && logoHeight > 0) {
        const maxLogo = maxLogoDimension(width, options.margin || 0);
        const safeWidth = clamp(logoWidth, 0, maxLogo);
        const safeHeight = clamp(logoHeight, 0, maxLogo);
        const x = (width - safeWidth) / 2;
        const y = (height - safeHeight) / 2;

        const logoRect = document.createElementNS(SVG_NS, "rect");
        logoRect.setAttribute("id", "qr-logo-space");
        logoRect.setAttribute("x", String(x));
        logoRect.setAttribute("y", String(y));
        logoRect.setAttribute("width", String(safeWidth));
        logoRect.setAttribute("height", String(safeHeight));
        logoRect.setAttribute("fill", bgColor);

        const clipGroup = svg.querySelector("#qr-visual-group");
        if (clipGroup) {
            clipGroup.appendChild(logoRect);
        } else {
            svg.appendChild(logoRect);
        }
    }
}

function triggerBlobDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
}

function svgBlobToPngBlob(svgBlob: Blob, size: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(svgBlob);
        const image = new Image();

        image.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = size;
                canvas.height = size;
                const context = canvas.getContext("2d");
                if (!context) {
                    throw new Error("Canvas unavailable");
                }
                context.clearRect(0, 0, size, size);
                context.drawImage(image, 0, 0, size, size);
                canvas.toBlob((pngBlob) => {
                    URL.revokeObjectURL(url);
                    if (!pngBlob) {
                        reject(new Error("PNG conversion failed"));
                        return;
                    }
                    resolve(pngBlob);
                }, "image/png");
            } catch (err) {
                URL.revokeObjectURL(url);
                reject(err);
            }
        };

        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Could not render SVG for PNG export"));
        };

        image.src = url;
    });
}

function buildOptions(): QrOptions {
    const settings = getSettings();
    const data = dataInput.value;

    return {
        width: settings.size,
        height: settings.size,
        type: "svg",
        data: data || " ",
        margin: settings.margin,
        qrOptions: {
            errorCorrectionLevel: settings.ec,
        },
        dotsOptions: {
            color: settings.fg,
            type: settings.dots,
        },
        cornersSquareOptions: {
            color: settings.fg,
            type: settings.cornerSquare,
        },
        cornersDotOptions: {
            color: settings.fg,
            type: settings.cornerDot,
        },
        backgroundOptions: {
            color: settings.bg,
        },
    };
}

function setStatus(message: string, tone: "ok" | "error" = "ok") {
    statusEl.textContent = message;
    statusEl.dataset.tone = tone;
}

function validate(): boolean {
    const data = dataInput.value;
    const bytes = utf8ByteLength(data);
    const chars = data.length;

    charCount.textContent =
        chars + (chars === 1 ? " character" : " characters") + " · " + bytes + (bytes === 1 ? " byte" : " bytes");

    if (!data.trim()) {
        setStatus("Enter content to generate a QR code.", "error");
        downloadBtn.disabled = true;
        return false;
    }

    if (bytes > MAX_BYTES) {
        setStatus("Content is too large for a QR code (max " + MAX_BYTES + " bytes).", "error");
        downloadBtn.disabled = true;
        return false;
    }

    setStatus("Live preview updated.", "ok");
    downloadBtn.disabled = false;
    return true;
}

function init(QrCodeClass: new (options: QrOptions) => QrCode) {
    applySettingsFromUrl();
    updateDependentLimits();
    qrCode = new QrCodeClass(buildOptions());
    qrCode.applyExtension(visualExtension);
    qrCode.append(preview);
    syncUrlFromControls();
    validate();

    syncPair(sizeRange, sizeNumber);
    syncPair(marginRange, marginNumber);
    syncPair(radiusRange, radiusNumber);
    syncPair(logoWidthRange, logoWidthNumber);
    syncPair(logoHeightRange, logoHeightNumber);

    [dataInput, errorCorrection, foreground, background, dotsStyle, cornerSquareStyle, cornerDotStyle, downloadFormat].forEach(
        (el) => {
            el.addEventListener("input", updateQr);
            el.addEventListener("change", updateQr);
        }
    );

    downloadBtn.addEventListener("click", downloadQr);
    copyDataBtn.addEventListener("click", copyContent);

    window.addEventListener("popstate", () => {
        applySettingsFromUrl();
        updateQr();
    });
}

let qrCode: QrCode;

function updateQr() {
    updateDependentLimits();
    syncUrlFromControls();

    const valid = validate();
    try {
        qrCode.update(buildOptions());
        if (valid) {
            setStatus("Live preview updated.", "ok");
        }
    } catch (err) {
        console.error(err);
        setStatus("Could not generate QR code with the current settings.", "error");
        downloadBtn.disabled = true;
    }
}

async function downloadQr() {
    if (!validate()) {
        return;
    }

    const format = downloadFormat.value === "svg" ? "svg" : "png";
    const size = Number(sizeRange.value);
    downloadBtn.disabled = true;
    setStatus("Preparing download…", "ok");

    try {
        const svgBlob = await qrCode.getRawData("svg");
        if (!svgBlob) {
            throw new Error("Empty SVG");
        }

        if (format === "svg") {
            triggerBlobDownload(svgBlob, "qr-code.svg");
        } else {
            const pngBlob = await svgBlobToPngBlob(svgBlob, size);
            triggerBlobDownload(pngBlob, "qr-code.png");
        }

        setStatus("Downloaded as " + format.toUpperCase() + ".", "ok");
    } catch (err) {
        console.error(err);
        setStatus("Download failed. Try again.", "error");
    } finally {
        downloadBtn.disabled = !validate();
    }
}

async function copyContent() {
    const data = dataInput.value;
    if (!data) {
        setStatus("Nothing to copy.", "error");
        return;
    }

    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(data);
        } else {
            dataInput.focus();
            dataInput.select();
            document.execCommand("copy");
        }
        setStatus("Content copied to clipboard.", "ok");
    } catch (err) {
        console.error(err);
        setStatus("Could not copy content.", "error");
    }
}

if (typeof QRCodeStyling === "undefined") {
    setStatus("Could not load QR library. Check your network connection.", "error");
    downloadBtn.disabled = true;
} else {
    init(QRCodeStyling);
}

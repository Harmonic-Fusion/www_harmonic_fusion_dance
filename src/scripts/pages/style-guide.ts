import { requireElement } from "../lib/dom.ts";

const colors: Record<string, string> = {
    blue: "#0182e4",
    light_blue: "#0895ec",
    green: "#02ab57",
    light_green: "#05d760",
    dark_green: "#015813",
    xdark_blue: "#002f54",
    dark_blue2: "#015991",
    dark_blue: "#017ab0",
    dark_purple: "#1f153f",
    orange: "#ec9003",
};

const COPY_ICON = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
`;
const CHECK_ICON = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
    </svg>
`;

const colorsGrid = requireElement("colorsGrid");
const toast = requireElement("toast");

function showToast(text: string) {
    toast.textContent = `Copied ${text} to clipboard!`;
    toast.classList.add("show");
}

function copyToClipboard(text: string, button: HTMLButtonElement) {
    navigator.clipboard
        .writeText(text)
        .then(() => {
            showToast(text);
            button.classList.add("copied");
            button.innerHTML = CHECK_ICON;

            setTimeout(() => {
                toast.classList.remove("show");
                button.classList.remove("copied");
                button.innerHTML = COPY_ICON;
            }, 2000);
        })
        .catch((err) => {
            console.error("Failed to copy:", err);
            // Fallback for older browsers
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);

            showToast(text);
            setTimeout(() => {
                toast.classList.remove("show");
            }, 2000);
        });
}

Object.entries(colors).forEach(([name, code]) => {
    const colorItem = document.createElement("div");
    colorItem.className = "color-item";

    const colorSquare = document.createElement("div");
    colorSquare.className = "color-square";
    colorSquare.style.backgroundColor = code;

    const colorInfo = document.createElement("div");
    colorInfo.className = "color-info";

    const colorName = document.createElement("div");
    colorName.className = "color-name";
    colorName.textContent = name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    const colorCode = document.createElement("div");
    colorCode.className = "color-code";
    colorCode.textContent = code;

    const copyButton = document.createElement("button");
    copyButton.className = "copy-button";
    copyButton.innerHTML = COPY_ICON;
    copyButton.addEventListener("click", () => {
        copyToClipboard(code, copyButton);
    });

    colorInfo.appendChild(colorName);
    colorInfo.appendChild(colorCode);
    colorItem.appendChild(colorSquare);
    colorItem.appendChild(colorInfo);
    colorItem.appendChild(copyButton);
    colorsGrid.appendChild(colorItem);
});

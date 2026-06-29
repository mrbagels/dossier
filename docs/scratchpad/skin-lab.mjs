// Inject the Console Slate override layer into a generated dossier HTML file.
// Usage: node skin-lab.mjs [inputHtml] [outputHtml]
import fs from "node:fs";
import { SLATE_OVERRIDES } from "./slate-theme.css.mjs";

const input = process.argv[2] || new URL("./design-lab.html", import.meta.url).pathname;
const output = process.argv[3] || input.replace(/\.html$/, ".slate.html");

let html = fs.readFileSync(input, "utf8");
const tag = `<style id="ds-slate">${SLATE_OVERRIDES}</style>`;
if (html.includes('id="ds-slate"')) {
  html = html.replace(/<style id="ds-slate">[\s\S]*?<\/style>/, tag);
} else {
  html = html.replace("</head>", tag + "\n</head>");
}
fs.writeFileSync(output, html);
console.log("skinned:", output, `(${(html.length / 1024).toFixed(0)} KB)`);

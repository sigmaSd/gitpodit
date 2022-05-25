// deno-lint-ignore-file no-unused-vars
import { Creds, downloadFromGitpod, Page } from "./src/gitpod.ts";
import { Secret } from "https://deno.land/x/cliffy@v0.24.2/prompt/mod.ts";

console.log("Github credentials");
const creds: Creds = {
  email: await Secret.prompt("email> "),
  password: await Secret.prompt("password> "),
};

if (!creds.email) throw "email address is required";
if (!creds.password) throw "password is required";

const cargoWorkspaces = {
  repo: "https://github.com/pksunkara/cargo-workspaces",
  shell: async (page: Page) => {
    await page.keyboard.type("cd cargo-workspaces");
    await page.keyboard.press("Enter");
    await page.keyboard.type("cargo build --release");
    await page.keyboard.press("Enter");
  },
  downloadPath: "target/release/cargo-workspaces",
};
const irust = {
  repo: "https://github.com/sigmaSd/irust",
  shell: async (page: Page) => {
    await page.keyboard.type("cargo build");
    await page.keyboard.press("Enter");
  },
  downloadPath: "target/debug/irust",
};
const cargoEdit = {
  repo: "https://github.com/killercup/cargo-edit",
  shell: async (page: Page) => {
    await page.keyboard.type("cargo build --release");
    await page.keyboard.press("Enter");
  },
  downloadPath: "target/release/cargo-edit",
};
const pastelDebug = {
  repo: "https://github.com/sharkdp/pastel",
  shell: async (page: Page) => {
    await page.keyboard.type("cargo build");
    await page.keyboard.press("Enter");
  },
  downloadPath: "target/debug/pastel",
};
const lapce = {
  repo: "https://github.com/lapce/lapce",
  shell: async (page: Page) => {
    await page.keyboard.type("sudo apt install libgtk-3-dev");
    await page.keyboard.press("Enter");
    await page.keyboard.type("cargo build --release");
    await page.keyboard.press("Enter");
  },
  downloadPath: "target/release/lapce",
};

await downloadFromGitpod(pastelDebug, creds, { headless: false });

import { Creds, downloadFromGitpod, Page } from "./src/gitpod.ts";

const creds: Creds = {
  email: prompt("email> ") || "",
  password: prompt("password> ") || "",
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

await downloadFromGitpod(cargoEdit, creds);

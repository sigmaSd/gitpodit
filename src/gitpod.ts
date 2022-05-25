import puppeteer, {
  Browser,
  Page,
} from "https://deno.land/x/puppeteer@9.0.2/mod.ts";
import { info } from "./utils.ts";

export { Page } from "https://deno.land/x/puppeteer@9.0.2/mod.ts";

export interface Meta {
  repo: string;
  shell: (page: Page) => Promise<void>;
  downloadPath: string;
}

export interface Creds {
  email: string;
  password: string;
}

export async function downloadFromGitpod(
  { repo, shell, downloadPath }: Meta,
  { email, password }: Creds,
  { headless = true }: { headless?: boolean } = {},
) {
  info("Opening browser");
  const browser = await puppeteer.launch({ headless });

  info("Opening page and logging in");
  const page = (await browser.pages())[0];
  await page.goto(
    `https://gitpod.io/#${repo}`,
    { waitUntil: "networkidle0" },
  );

  await page.evaluate(async () => {
    (document.querySelector(".btn-login")! as HTMLBodyElement).click();
    await new Promise((r) => setTimeout(r, 3000));
  });

  await (await browser.pages())[1].evaluate(
    (email, pass) => {
      const login =
        (document.querySelector("#login_field")! as HTMLInputElement);
      login.value = email;
      (document.querySelector("#password")! as HTMLInputElement).value = pass;
      (document.querySelector(".btn")! as HTMLButtonElement).click();
    },
    email,
    password,
  );

  info("Waiting for shell");
  await page.waitForNavigation({ timeout: 0 });
  await new Promise((r) => setTimeout(r, 15000));

  info("Opening terminal");
  await page.keyboard.press("F1");
  await page.keyboard.type("new terminal");
  await page.keyboard.press("Enter");

  await page.waitForSelector(".xterm-cursor-layer", { timeout: 0 });
  await page.evaluate(() => {
    (document.querySelector(".xterm-cursor-layer") as HTMLCanvasElement)
      .focus();
  });

  await shell(page);
  await page.keyboard.type("python -m http.server");
  await page.keyboard.press("Enter");
  info("shell commands are queued, waiting for compilation to finish");

  const TargetURl = "https://8000-" + page.url().replace("https://", "") +
    downloadPath;
  info("Download url is: " + TargetURl);

  const newPage = await browser.newPage();
  while (true) {
    try {
      await newPage.goto(
        TargetURl,
      );
      await new Promise((r) => setTimeout(r, 1000));
    } catch {
      await newPage.close();
      break;
    }
  }

  info("Compilation finished, waiting for download to finish");
  await waitForDownload(browser);
  info("Download finished, the file is located at your system download folder");

  await page.keyboard.press("F1");
  await page.keyboard.type("stop workspace");
  await page.keyboard.press("Enter");
  await new Promise((r) => setTimeout(r, 3000));
  await browser.close();
}

async function waitForDownload(browser: Browser) {
  const dmPage = await browser.newPage();
  await dmPage.goto("chrome://downloads/");

  await dmPage.bringToFront();
  await dmPage.waitForFunction(() => {
    try {
      const donePath = document.querySelector("downloads-manager")!.shadowRoot!
        .querySelector(
          "#frb0",
        )!.shadowRoot!.querySelector("#pauseOrResume")!;
      if ((donePath as HTMLButtonElement).innerText != "Pause") {
        return true;
      }
    } catch {
      //
    }
  }, { timeout: 0 });
}

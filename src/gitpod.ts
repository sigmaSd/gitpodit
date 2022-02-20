import puppeteer, {
  Browser,
  Page,
} from "https://deno.land/x/puppeteer@9.0.2/mod.ts";

type Meta = {
  repo: string;
  shell: (page: Page) => Promise<void>;
  downloadPath: string;
};

const email = Deno.env.get("email")!;
const pass = Deno.env.get("pass")!;
if (!email) throw "email address is required";
if (!pass) throw "password is required";

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
  console.log("Download finished");
}

async function downloadFromGitpod({ repo, shell, downloadPath }: Meta) {
  console.log("starting gitpod download");
  const browser = await puppeteer.launch({ headless: false });
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
    pass,
  );

  await page.waitForNavigation();
  await new Promise((r) => setTimeout(r, 15000));

  await page.keyboard.press("F1");
  await page.keyboard.type("new terminal");
  await page.keyboard.press("Enter");

  await page.waitForSelector(".xterm-cursor-layer");
  await page.evaluate(() => {
    (document.querySelector(".xterm-cursor-layer") as HTMLCanvasElement)
      .focus();
  });

  await shell(page);
  await page.keyboard.type("python -m http.server");
  await page.keyboard.press("Enter");

  const TargetURl = "https://8000-" + page.url().replace("https://", "") +
    downloadPath;
  console.log("Download url is: ", TargetURl);

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

  await waitForDownload(browser);

  await page.keyboard.press("F1");
  await page.keyboard.type("stop workspace");
  await page.keyboard.press("Enter");
  await new Promise((r) => setTimeout(r, 3000));
  await browser.close();
}

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

await downloadFromGitpod(cargoWorkspaces);

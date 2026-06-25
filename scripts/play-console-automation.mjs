import { chromium } from "playwright";
import fs from "node:fs";

const action = process.argv[2] || "status";
const aabPath =
  "C:\\Users\\Augustus Rex\\Projects\\Releases\\application-5f5e6c9d-bc3b-42df-87eb-e2269c313537.aab";
const releaseNotes = `<en-GB>
Welcome to Ari v1.0.0!

- Voice input: log expenses by speaking
- Tomo AI money coach answers your finance questions
- Smart merchant detection for Indian apps
- Tax estimator for FY 2025-26: compare Old vs New regime
- Savings goals, custom budgets, daily heatmap
- Private Mode and encrypted on-device storage
- Free forever: no ads, no subscription

Found a bug or have feedback? Tap Settings > Send Feedback.
</en-GB>`;

const browser = await chromium.connectOverCDP("http://127.0.0.1:9223");
const context = browser.contexts()[0];
const page =
  context.pages().find((candidate) => candidate.url().includes("play.google.com/console")) ||
  context.pages()[0];

async function dump(limit = 5000) {
  await page.waitForLoadState("domcontentloaded", { timeout: 30000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  console.log(await page.title());
  console.log(page.url());
  const text = await page.locator("body").innerText({ timeout: 30000 });
  console.log(text.slice(0, limit));
}

try {
  if (action === "status") {
    await dump();
  } else if (action === "open-ari") {
    const href = await page.locator("a[aria-label='View Ari']").first().getAttribute("href");
    if (!href) throw new Error("Could not find Ari app link");
    await page.goto(new URL(href, page.url()).toString());
    await dump();
  } else if (action === "click-text") {
    const text = process.argv[3];
    if (!text) throw new Error("Missing text argument");
    await page.getByText(text, { exact: false }).first().click();
    await dump();
  } else if (action === "click-button") {
    const text = process.argv[3];
    if (!text) throw new Error("Missing button text argument");
    await page.getByRole("button", { name: text }).click();
    await dump();
  } else if (action === "click-button-index") {
    const index = Number(process.argv[3]);
    if (!Number.isInteger(index)) throw new Error("Missing numeric button index");
    await page.locator("button").nth(index).click();
    await dump(8000);
  } else if (action === "goto") {
    const url = process.argv[3];
    if (!url) throw new Error("Missing url argument");
    await page.goto(url);
    await dump();
  } else if (action === "fill-label") {
    const label = process.argv[3];
    const value = process.argv[4] || "";
    if (!label) throw new Error("Missing label argument");
    await page.getByLabel(label, { exact: false }).fill(value);
    await dump();
  } else if (action === "upload-aab") {
    const fileInput = page.locator("input[type='file']").first();
    await fileInput.setInputFiles(aabPath);
    await dump();
  } else if (action === "cdp-upload-aab") {
    const session = await context.newCDPSession(page);
    const { root } = await session.send("DOM.getDocument", { depth: -1, pierce: true });
    const { nodeId } = await session.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector: "input[type='file']",
    });
    if (!nodeId) throw new Error("Could not find file input");
    await session.send("DOM.setFileInputFiles", {
      nodeId,
      files: [aabPath],
    });
    await dump();
  } else if (action === "fill-release") {
    await page.getByRole("textbox", { name: "Release name" }).fill("1.0.0 (2)");
    await page.getByRole("textbox", { name: "Release notes" }).fill(releaseNotes);
    await dump();
  } else if (action === "fill-store-listing") {
    const md = fs.readFileSync("STORE_LISTING.md", "utf8");
    const short = "AI personal finance with smart budgets, savings goals and spending insights";
    const full = md.match(/## Full description[\s\S]*?```\r?\n([\s\S]*?)\r?\n```/)?.[1]?.trim();
    if (!short || !full) throw new Error("Could not parse store listing copy");
    await page.locator('input[aria-label="Name of the app"]').fill("Ari - AI Money Coach");
    await page.locator('input[aria-label="Short description of the app"]').fill(short);
    await page.locator('textarea[aria-label="Full description of the app"]').fill(full);
    await dump(5000);
  } else if (action === "upload-store-assets") {
    const root = process.cwd().replaceAll("\\", "/");
    const slots = [
      { index: 0, files: [`${root}/ari_assets_playstore/ari_icon_512.png`], marker: "ari_icon_512.png" },
      { index: 1, files: [`${root}/ari_assets_playstore/ari_feature_graphic_1024x500.png`], marker: "ari_feature_graphic_1024x500.png" },
      {
        index: 2,
        files: [
          `${root}/ari_assets_playstore/ari_screenshot_01_dashboard.png`,
          `${root}/ari_assets_playstore/ari_screenshot_02_voice_input.png`,
          `${root}/ari_assets_playstore/ari_screenshot_03_tomo_chat.png`,
          `${root}/ari_assets_playstore/ari_screenshot_04_budgets.png`,
          `${root}/ari_assets_playstore/ari_screenshot_05_savings_goals.png`,
          `${root}/ari_assets_playstore/ari_screenshot_06_tax_estimator.png`,
          `${root}/ari_assets_playstore/ari_screenshot_07_daily_heatmap.png`,
          `${root}/ari_assets_playstore/ari_screenshot_08_privacy_settings.png`,
        ],
        marker: "ari_screenshot_08_privacy_settings.png",
      },
    ];

    async function closePanel() {
      await page.getByRole("button", { name: "Close side panel", exact: true }).click({ force: true, timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(500);
    }

    for (const slot of slots) {
      await closePanel();
      const visibleAddButtons = await page.locator("button").evaluateAll((buttons) =>
        buttons
          .map((button, index) => {
            const rect = button.getBoundingClientRect();
            return { index, text: button.textContent?.trim(), width: rect.width, y: rect.y };
          })
          .filter((item) => item.width > 0 && item.text === "Add assets")
          .sort((a, b) => a.y - b.y),
      );
      const button = visibleAddButtons[slot.index];
      if (!button) throw new Error(`Could not find Add assets button for slot ${slot.index}`);
      await page.locator("button").nth(button.index).click({ force: true });
      await page.waitForTimeout(1000);
      await page.locator("input[type='file']").setInputFiles(slot.files);
      await page.getByText(slot.marker, { exact: false }).waitFor({ state: "visible", timeout: 60000 }).catch(() => {});
      await page.waitForTimeout(3000);
      console.log(`uploaded ${slot.marker}`);
    }
    await closePanel();
    await dump(7000);
  } else if (action === "upload-phone-screenshots") {
    const root = process.cwd().replaceAll("\\", "/");
    const files = [
      "ari_screenshot_01_dashboard.png",
      "ari_screenshot_02_voice_input.png",
      "ari_screenshot_03_tomo_chat.png",
      "ari_screenshot_04_budgets.png",
      "ari_screenshot_05_savings_goals.png",
      "ari_screenshot_06_tax_estimator.png",
      "ari_screenshot_07_daily_heatmap.png",
      "ari_screenshot_08_privacy_settings.png",
    ].map((name) => `${root}/ari_assets_playstore/${name}`);
    const visibleAddButtons = await page.locator("button").evaluateAll((buttons) =>
      buttons
        .map((button, index) => {
          const rect = button.getBoundingClientRect();
          return { index, text: button.textContent?.trim(), width: rect.width, y: rect.y };
        })
        .filter((item) => item.width > 0 && item.text === "Add assets")
        .sort((a, b) => a.y - b.y),
    );
    const phoneButton = visibleAddButtons[2];
    if (!phoneButton) throw new Error("Could not find phone screenshots Add assets button");
    await page.locator("button").nth(phoneButton.index).scrollIntoViewIfNeeded();
    await page.locator("button").nth(phoneButton.index).click();
    await page.waitForTimeout(1000);
    await page.locator("input[type='file']").setInputFiles(files);
    await page.getByText("ari_screenshot_08_privacy_settings.png", { exact: false }).waitFor({ state: "visible", timeout: 120000 }).catch(() => {});
    await page.waitForTimeout(5000);
    const addButton = page.getByRole("button", { name: "Add", exact: true });
    if ((await addButton.count()) > 0) {
      await addButton.click({ force: true });
      await page.waitForTimeout(3000);
    }
    await page.getByRole("button", { name: "Close side panel", exact: true }).click({ force: true }).catch(() => {});
    await dump(8000);
  } else if (action === "closed-countries-india") {
    await page.locator('input[aria-label="Search"]').fill("India");
    await page.waitForTimeout(1000);
    const box = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("*")).filter((element) => {
        const text = (element.textContent || "").replace(/\s+/g, " ").trim();
        return text.startsWith("India ") && text.includes("Not targeted");
      });
      for (const row of rows) {
        let container = row;
        for (let i = 0; i < 8 && container; i += 1, container = container.parentElement) {
          const text = (container.textContent || "").replace(/\s+/g, " ").trim();
          const rect = container.getBoundingClientRect();
          if (text.includes("India") && text.includes("Not targeted") && rect.width > 100 && rect.height > 20) {
            return { x: rect.right - 40, y: rect.top + rect.height / 2 };
          }
        }
      }
      return null;
    });
    if (!box) throw new Error("Could not find India row");
    await page.mouse.click(box.x, box.y);
    await page.waitForTimeout(1500);
    await dump(5000);
  } else if (action === "closed-testers-feedback") {
    const inputs = page.locator("textarea, input");
    const count = await inputs.count();
    let filled = false;
    for (let i = 0; i < count; i += 1) {
      const input = inputs.nth(i);
      const label = await input.getAttribute("aria-label").catch(() => "");
      if ((label || "").includes("Feedback")) {
        await input.fill("starhunter7@gmail.com");
        filled = true;
        break;
      }
    }
    if (!filled) {
      await page.locator("textarea").first().fill("starhunter7@gmail.com");
    }
    await page.waitForTimeout(500);
    await dump(5000);
  } else if (action === "list-links") {
    const links = await page.locator("a").evaluateAll((as) =>
      as.slice(0, 200).map((a) => ({
        text: a.innerText,
        href: a.href,
        aria: a.getAttribute("aria-label"),
      })),
    );
    console.log(JSON.stringify(links, null, 2));
  } else if (action === "list-buttons") {
    const buttons = await page.locator("button").evaluateAll((bs) =>
      bs.slice(0, 200).map((button, index) => ({
        index,
        text: button.innerText,
        aria: button.getAttribute("aria-label"),
        disabled: button.hasAttribute("disabled"),
      })),
    );
    console.log(JSON.stringify(buttons, null, 2));
  } else if (action === "list-radios") {
    const radios = await page.locator("input[type='radio']").evaluateAll((inputs) =>
      inputs.map((input, index) => {
        const label = input.id
          ? document.querySelector(`label[for="${CSS.escape(input.id)}"]`)?.textContent || ""
          : "";
        const rect = input.getBoundingClientRect();
        return {
          index,
          checked: input.checked,
          visible: Boolean(input.offsetWidth || input.offsetHeight || input.getClientRects().length),
          label: label.trim(),
          x: rect.x,
          y: rect.y,
        };
      }),
    );
    console.log(JSON.stringify(radios, null, 2));
  } else if (action === "list-checkboxes") {
    const boxes = await page.locator("input[type='checkbox']").evaluateAll((inputs) =>
      inputs.map((input, index) => {
        const label = input.id
          ? document.querySelector(`label[for="${CSS.escape(input.id)}"]`)?.textContent || ""
          : "";
        const rect = input.getBoundingClientRect();
        return {
          index,
          checked: input.checked,
          visible: Boolean(input.offsetWidth || input.offsetHeight || input.getClientRects().length),
          label: label.trim(),
          x: rect.x,
          y: rect.y,
        };
      }),
    );
    console.log(JSON.stringify(boxes, null, 2));
  } else if (action === "check-checkbox-index") {
    const index = Number(process.argv[3]);
    if (!Number.isInteger(index)) throw new Error("Missing numeric checkbox index");
    await page.locator("input[type='checkbox']").nth(index).check({ force: true });
    await dump(6000);
  } else if (action === "expand-section") {
    const name = process.argv[3];
    if (!name) throw new Error("Missing section name");
    await page.locator(`button[aria-label="Show content: ${name}"]`).first().click({ force: true });
    await dump(12000);
  } else if (action === "complete-data-details") {
    const entries = [
      { section: "Personal info", type: "Name", required: false, purposes: ["Account management"] },
      { section: "Personal info", type: "Email address", required: true, purposes: ["App functionality", "Account management"] },
      { section: "Financial info", type: "Other financial info", required: true, purposes: ["App functionality"] },
      { section: "App activity", type: "App interactions", required: false, purposes: ["Analytics"] },
      { section: "App activity", type: "Other user-generated content", required: false, purposes: ["App functionality"] },
      { section: "App info and performance", type: "Crash logs", required: false, purposes: ["Analytics"] },
      { section: "App info and performance", type: "Diagnostics", required: false, purposes: ["Analytics"] },
      { section: "App info and performance", type: "Other app performance data", required: false, purposes: ["Analytics"] },
      { section: "Device or other IDs", type: "Device or other IDs", required: false, purposes: ["Analytics"] },
    ];

    async function expandIfNeeded(section) {
      const button = page.locator(`button[aria-label="Show content: ${section}"]`).first();
      if ((await button.count()) > 0) {
        await button.click({ force: true }).catch(() => {});
        await page.waitForTimeout(300);
      }
    }

    async function openDataType(type) {
      const opened = await page.evaluate((typeName) => {
        const rows = Array.from(document.querySelectorAll("*")).filter((element) => {
          const text = (element.textContent || "").replace(/\s+/g, " ").trim();
          return text.startsWith(typeName) && /(?:Not started|Answer required|Start|Edit)/.test(text);
        });
        for (const row of rows) {
          let container = row;
          for (let i = 0; i < 8 && container; i += 1, container = container.parentElement) {
            const buttons = Array.from(container.querySelectorAll("button"));
            const target = buttons.find((button) => /Start|Edit|arrow_right_alt/.test(button.textContent || ""));
            if (target) {
              target.click();
              return true;
            }
          }
        }
        return false;
      }, type);
      if (!opened) throw new Error(`Could not open data type ${type}`);
      await page.waitForTimeout(800);
    }

    async function setModalAnswer(entry) {
      await page.getByText("Collected", { exact: true }).click({ force: true }).catch(() => {});
      const inputs = page.locator("input");
      // indexes are stable in the data type modal: 4 = no ephemeral, 5/6 = required/optional.
      await inputs.nth(4).check({ force: true });
      await inputs.nth(entry.required ? 5 : 6).check({ force: true });
      for (const purpose of entry.purposes) {
        await page.getByText(purpose, { exact: true }).click({ force: true });
      }
      await page.getByRole("button", { name: "Save", exact: true }).last().click({ force: true });
      await page.waitForTimeout(1000);
    }

    for (const entry of entries) {
      await expandIfNeeded(entry.section);
      await openDataType(entry.type);
      await setModalAnswer(entry);
      console.log(`completed ${entry.type}`);
    }
    await dump(12000);
  } else if (action === "finish-data-usage") {
    const entries = [
      { section: "Personal info", type: "Name", required: false, purposes: ["Account management"] },
      { section: "Personal info", type: "Email address", required: true, purposes: ["App functionality", "Account management"] },
      { section: "Financial info", type: "Other financial info", required: true, purposes: ["App functionality"] },
      { section: "App activity", type: "App interactions", required: false, purposes: ["Analytics"] },
      { section: "App activity", type: "Other user-generated content", required: false, purposes: ["App functionality"] },
      { section: "App info and performance", type: "Crash logs", required: false, purposes: ["Analytics"] },
      { section: "App info and performance", type: "Diagnostics", required: false, purposes: ["Analytics"] },
      { section: "App info and performance", type: "Other app performance data", required: false, purposes: ["Analytics"] },
      { section: "Device or other IDs", type: "Device or other IDs", required: false, purposes: ["Analytics"] },
    ];

    async function closeCurrentPanel() {
      const closed = await page.evaluate(() => {
        const panel =
          document.querySelector(".pane.modal.visible") ||
          Array.from(document.querySelectorAll('[role="dialog"]')).find((item) =>
            item.textContent?.includes("Is this data collected"),
          );
        const closeButton = panel?.querySelector('button[aria-label="Close"]');
        if (closeButton) {
          closeButton.click();
          return true;
        }
        return false;
      });
      if (closed) await page.waitForTimeout(500);
    }

    async function expandSection(section) {
      await page
        .locator(`button[aria-label="Show content: ${section}"]`)
        .first()
        .click({ force: true, timeout: 1500 })
        .catch(() => {});
      await page.waitForTimeout(300);
    }

    async function openEntry(entry) {
      await expandSection(entry.section);
      const alreadyCompleted = await page.evaluate((type) => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const target = buttons.find((button) => button.getAttribute("aria-label") === `Open ${type} questions`);
        if (!target) return false;
        let container = target;
        for (let i = 0; i < 7 && container; i += 1, container = container.parentElement) {
          const text = (container.textContent || "").replace(/\s+/g, " ");
          if (text.includes(type) && text.includes("Completed")) return true;
        }
        return false;
      }, entry.type);
      if (alreadyCompleted) return false;
      const opened = await page.evaluate((type) => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const target = buttons.find((button) => button.getAttribute("aria-label") === `Open ${type} questions`);
        if (target) {
          target.click();
          return true;
        }
        return false;
      }, entry.type);
      if (!opened) throw new Error(`Could not open ${entry.type}`);
      await page.waitForTimeout(600);
      return true;
    }

    async function answerEntry(entry) {
      const result = await page.evaluate((details) => {
        const dialog =
          document.querySelector(".pane.modal.visible") ||
          Array.from(document.querySelectorAll('[role="dialog"]')).find((item) =>
            item.textContent?.includes("Is this data collected"),
          );
        if (!dialog) return { ok: false, reason: "No data-type panel is open" };

        const visible = (input) => {
          const rect = input.getBoundingClientRect();
          return Boolean(rect.width || rect.height || input.getClientRects().length);
        };
        const setInput = (selector, offset, checked = true) => {
          const inputs = Array.from(dialog.querySelectorAll(selector)).filter(visible);
          const input = inputs[offset];
          if (!input) return false;
          if (input.checked !== checked) input.click();
          return true;
        };

        // Check "Collected", leave "Shared" unchecked.
        if (!setInput('input[type="checkbox"]', 0, true)) return { ok: false, reason: "Could not select Collected" };

        return { ok: true, reason: "Collected selected" };
      }, entry);
      if (!result.ok) throw new Error(`${entry.type}: ${result.reason}`);
      await page.waitForTimeout(400);

      const saved = await page.evaluate((details) => {
        const dialog =
          document.querySelector(".pane.modal.visible") ||
          Array.from(document.querySelectorAll('[role="dialog"]')).find((item) =>
            item.textContent?.includes("Is this data collected"),
          );
        if (!dialog) return { ok: false, reason: "No data-type panel after collected" };

        const visible = (input) => {
          const rect = input.getBoundingClientRect();
          return Boolean(rect.width || rect.height || input.getClientRects().length);
        };
        const radios = Array.from(dialog.querySelectorAll('input[type="radio"]')).filter(visible);
        if (radios.length < 4) return { ok: false, reason: `Expected 4 radio buttons, found ${radios.length}` };
        radios[1].click(); // No, not processed ephemerally.
        radios[details.required ? 2 : 3].click();

        const purposeLabels = [
          "App functionality",
          "Analytics",
          "Developer communications",
          "Advertising or marketing",
          "Fraud prevention, security and compliance",
          "Personalisation",
          "Account management",
        ];
        const checkboxes = Array.from(dialog.querySelectorAll('input[type="checkbox"]')).filter(visible);
        for (const purpose of details.purposes) {
          const index = purposeLabels.indexOf(purpose);
          const checkbox = checkboxes[index + 2];
          if (!checkbox) return { ok: false, reason: `Missing purpose ${purpose}` };
          if (!checkbox.checked) checkbox.click();
        }

        const save = Array.from(dialog.querySelectorAll("button")).find(
          (button) => button.textContent?.trim() === "Save" && !button.disabled,
        );
        if (!save) return { ok: false, reason: "Save button is disabled or missing" };
        save.click();
        return { ok: true, reason: "Saved" };
      }, entry);
      if (!saved.ok) throw new Error(`${entry.type}: ${saved.reason}`);
      await page.waitForTimeout(1000);
    }

    await closeCurrentPanel();
    for (const entry of entries) {
      const opened = await openEntry(entry);
      if (!opened) {
        console.log(`already completed ${entry.type}`);
        continue;
      }
      await answerEntry(entry);
      console.log(`completed ${entry.type}`);
    }
    await dump(12000);
  } else if (action === "finish-data-usage-pw" || action === "finish-data-usage-rest") {
    const entries =
      action === "finish-data-usage-rest"
        ? [
            { section: "Personal info", type: "Email address", required: true, purposes: ["App functionality", "Account management"] },
            { section: "App activity", type: "App interactions", required: false, purposes: ["Analytics"] },
            { section: "App activity", type: "Other user-generated content", required: false, purposes: ["App functionality"] },
            { section: "App info and performance", type: "Crash logs", required: false, purposes: ["Analytics"] },
            { section: "App info and performance", type: "Diagnostics", required: false, purposes: ["Analytics"] },
            { section: "App info and performance", type: "Other app performance data", required: false, purposes: ["Analytics"] },
            { section: "Device or other IDs", type: "Device or other IDs", required: false, purposes: ["Analytics"] },
          ]
        : [
            { section: "Personal info", type: "Name", required: false, purposes: ["Account management"] },
            { section: "Personal info", type: "Email address", required: true, purposes: ["App functionality", "Account management"] },
            { section: "Financial info", type: "Other financial info", required: true, purposes: ["App functionality"] },
            { section: "App activity", type: "App interactions", required: false, purposes: ["Analytics"] },
            { section: "App activity", type: "Other user-generated content", required: false, purposes: ["App functionality"] },
            { section: "App info and performance", type: "Crash logs", required: false, purposes: ["Analytics"] },
            { section: "App info and performance", type: "Diagnostics", required: false, purposes: ["Analytics"] },
            { section: "App info and performance", type: "Other app performance data", required: false, purposes: ["Analytics"] },
            { section: "Device or other IDs", type: "Device or other IDs", required: false, purposes: ["Analytics"] },
          ];
    const purposeIndexes = {
      "App functionality": 2,
      Analytics: 3,
      "Developer communications": 4,
      "Advertising or marketing": 5,
      "Fraud prevention, security and compliance": 6,
      Personalisation: 7,
      "Account management": 8,
    };

    async function closePanelIfOpen() {
      if ((await page.locator(".pane.modal.visible").count()) > 0) {
        await page.locator(".pane.modal.visible button[aria-label='Close']").click({ force: true }).catch(() => {});
        await page.waitForTimeout(600);
      }
    }

    async function ensureStepFour() {
      const text = await page.locator("body").innerText({ timeout: 30000 });
      if (text.includes("Step 3 of 5, Data types")) {
        await page.getByRole("button", { name: "Next", exact: true }).click({ force: true });
        await page.waitForTimeout(800);
      }
    }

    async function fillOpenPanel(entry) {
      const panel = page.locator(".pane.modal.visible");
      await panel.locator("input[type='checkbox']").nth(0).check({ force: true });
      await page.waitForTimeout(250);
      await panel.locator("input[type='radio']").nth(1).check({ force: true });
      await panel.locator("input[type='radio']").nth(entry.required ? 2 : 3).check({ force: true });
      for (const purpose of entry.purposes) {
        await panel.locator("input[type='checkbox']").nth(purposeIndexes[purpose]).check({ force: true });
      }
      const save = panel.locator("button").filter({ hasText: "Save" });
      const saveCount = await save.count();
      if (saveCount < 1) throw new Error(`No Save button found for ${entry.type}`);
      await save.nth(saveCount - 1).click({ force: true });
      await page.waitForTimeout(1000);
    }

    await closePanelIfOpen();
    await ensureStepFour();
    for (const entry of entries) {
      await ensureStepFour();
      await page
        .locator(`button[aria-label="Show content: ${entry.section}"]`)
        .first()
        .click({ force: true, timeout: 1500 })
        .catch(() => {});
      await page.waitForTimeout(300);
      await page.locator(`button[aria-label="Open ${entry.type} questions"]`).first().click({ force: true });
      await page.waitForTimeout(600);
      await fillOpenPanel(entry);
      console.log(`saved ${entry.type}`);
    }
    await dump(12000);
  } else if (action === "check-radio-index") {
    const index = Number(process.argv[3]);
    if (!Number.isInteger(index)) throw new Error("Missing numeric radio index");
    await page.locator("input[type='radio']").nth(index).check({ force: true });
    await dump(6000);
  } else if (action === "finish-data-usage-rest2") {
    const entries = [
      { section: "Personal info", type: "Email address", required: true, purposes: ["App functionality", "Account management"] },
      { section: "App activity", type: "App interactions", required: false, purposes: ["Analytics"] },
      { section: "App activity", type: "Other user-generated content", required: false, purposes: ["App functionality"] },
      { section: "App info and performance", type: "Crash logs", required: false, purposes: ["Analytics"] },
      { section: "App info and performance", type: "Diagnostics", required: false, purposes: ["Analytics"] },
      { section: "App info and performance", type: "Other app performance data", required: false, purposes: ["Analytics"] },
      { section: "Device or other IDs", type: "Device or other IDs", required: false, purposes: ["Analytics"] },
    ];
    const purposeIndexes = { "App functionality": 2, Analytics: 3, "Account management": 8 };

    async function clickVisibleNextIfOnStep3() {
      const body = await page.locator("body").innerText({ timeout: 30000 });
      if (!body.includes("Step 3 of 5, Data types")) return;
      const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const next = buttons.find((button) => {
          const rect = button.getBoundingClientRect();
          return button.textContent?.trim() === "Next" && !button.disabled && rect.width > 0 && rect.y > 500;
        });
        if (!next) return false;
        next.click();
        return true;
      });
      if (!clicked) throw new Error("Could not click Step 3 Next");
      await page.waitForTimeout(1000);
    }

    async function openEntry(entry) {
      await clickVisibleNextIfOnStep3();
      await page.evaluate((section) => {
        const button = Array.from(document.querySelectorAll("button")).find(
          (item) => item.getAttribute("aria-label") === `Show content: ${section}`,
        );
        button?.click();
      }, entry.section);
      await page.waitForTimeout(300);
      const clicked = await page.evaluate((type) => {
        const target = Array.from(document.querySelectorAll("button")).find(
          (button) => button.getAttribute("aria-label") === `Open ${type} questions`,
        );
        if (!target) return false;
        target.click();
        return true;
      }, entry.type);
      if (!clicked) throw new Error(`Could not open ${entry.type}`);
      await page.waitForTimeout(700);
      const panelCount = await page.locator(".pane.modal.visible").filter({ hasText: "Is this data collected" }).count();
      if (panelCount < 1) throw new Error(`Panel did not open for ${entry.type}`);
    }

    async function saveEntry(entry) {
      const panel = page.locator(".pane.modal.visible").filter({ hasText: "Is this data collected" }).first();
      await panel.locator("input[type='checkbox']").nth(0).check({ force: true });
      await page.waitForTimeout(250);
      await panel.locator("input[type='radio']").nth(1).check({ force: true });
      await panel.locator("input[type='radio']").nth(entry.required ? 2 : 3).check({ force: true });
      for (const purpose of entry.purposes) {
        await panel.locator("input[type='checkbox']").nth(purposeIndexes[purpose]).check({ force: true });
      }
      const clicked = await page.evaluate(() => {
        const panel = Array.from(document.querySelectorAll(".pane.modal.visible")).find((item) =>
          item.textContent?.includes("Is this data collected"),
        );
        const save = Array.from(panel?.querySelectorAll("button") || []).find(
          (button) => button.textContent?.trim() === "Save" && !button.disabled,
        );
        if (!save) return false;
        save.click();
        return true;
      });
      if (!clicked) throw new Error(`Could not click enabled Save for ${entry.type}`);
      await page.waitForTimeout(1200);
    }

    for (const entry of entries) {
      await openEntry(entry);
      await saveEntry(entry);
      console.log(`saved ${entry.type}`);
    }
    await dump(12000);
  } else if (action === "start-declaration") {
    const heading = process.argv[3];
    if (!heading) throw new Error("Missing declaration heading");
    const clicked = await page.evaluate((headingText) => {
      const candidates = Array.from(document.querySelectorAll("*")).filter((element) =>
        (element.textContent || "").trim().startsWith(headingText),
      );
      for (const candidate of candidates) {
        let container = candidate;
        for (let i = 0; i < 8 && container; i += 1, container = container.parentElement) {
          const button = Array.from(container.querySelectorAll("button")).find((item) =>
            (item.textContent || "").includes("Start declaration"),
          );
          if (button) {
            button.click();
            return true;
          }
        }
      }
      return false;
    }, heading);
    if (!clicked) throw new Error(`Could not find Start declaration for ${heading}`);
    await dump();
  } else {
    throw new Error(`Unknown action: ${action}`);
  }
} finally {
  await browser.close();
}

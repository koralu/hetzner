import { Page } from "puppeteer";
import colors from "colors/safe.js";
import fetch from "cross-fetch";
import fs from "fs";

export default class BrandAnalytics {
  constructor() {}

  static async goToUrl(page: Page, url: string, countryCode: Country["code"]) {
    await page.goto(url);
    await new Promise((r) => setTimeout(r, 5000));

    try {
      await BrandAnalytics.isBrandAnalyticsDashboard(page);
      console.log(colors.green("We are in Brand Analytics Dashboard"));
    } catch (e) {
      try {
        console.log(colors.yellow(e + "A1"));
        await BrandAnalytics.signIn(page);
        try {
          await BrandAnalytics.isBrandAnalyticsDashboard(page);
        } catch (e) {
          console.log(colors.yellow(e + "A2"));
          try {
            await BrandAnalytics.selectBrand(page, countryCode);
          } catch (e) {
            throw e;
          }
        }
      } catch (e) {
        console.log(colors.yellow(e + " B1"));
        try {
          await BrandAnalytics.selectBrand(page, countryCode);
        } catch (e) {
          throw e;
        }
      }
    }
    const cookies_new = await page.cookies();
    await fs.promises.writeFile(
      `src/cookies.json`,
      JSON.stringify(cookies_new, null, 2)
    );
  }

  private static async isBrandAnalyticsDashboard(page: Page) {
    try {
      await page.waitForSelector('span[class="dashboard-title"]', {
        timeout: 2000,
      });
    } catch (err) {
      throw "[Not in Brand Analytics Dashboard]";
    }
  }

  private static async signIn(page: Page) {
    try {
      const ap_email = process.env.AMAZON_EMAIL;
      const ap_password = process.env.AMAZON_PASSWORD;

      await page.waitForSelector("#ap_password", { timeout: 2000 });

      try {
        await page.waitForSelector("#ap_email", { timeout: 2000 });
        await page.focus("#ap_email");
        await page.keyboard.type(ap_email, { delay: 100 });
      } catch {
        console.log(colors.yellow("We already have user filled in"));
      }

      await page.focus("#ap_password");
      await page.keyboard.type(ap_password, { delay: 100 });

      await page.waitForSelector("#signInSubmit", { timeout: 10000 });
      await new Promise((r) => setTimeout(r, 1000));
      await page.click("#signInSubmit");

      await new Promise((r) => setTimeout(r, 5000));

      try {
        await BrandAnalytics.insertOtp(page);
        await new Promise((r) => setTimeout(r, 5000));
      } catch (e) {
        throw `[Insert Otp Step][${e}]`;
      }
    } catch (err) {
      throw "[Insert user/password Step]" + err;
    }
  }

  private static async selectBrand(page: Page, countryCode: Country["code"]) {
    const h1s: ICountryCodes = {
      GB: "Select a Merchant and Marketplace",
      US: "Select a Merchant and Marketplace",
      DE: "Händler und Marketplace auswählen",
      IT: "Seleziona un venditore e un mercato",
      FR: "Sélectionnez un vendeur et Marketplace",
      ES: "Selecciona un vendedor y un mercado",
      SE: "Select a Merchant and Marketplace",
      CA: "Select a Merchant and Marketplace",
      MX: "Select a Merchant and Marketplace",
      AU: "Select a Merchant and Marketplace",
      NL: "Select a Merchant and Marketplace",
    };
    const countries: ICountryCodes = {
      US: "United States",
      GB: "United Kingdom",
      DE: "Deutschland",
      IT: "Italia",
      FR: "France",
      ES: "España",
      SE: "Sverige",
      CA: "Canada",
      MX: "Mexico",
      AU: "Australia",
      NL: "Netherlands",
    };

    const countriesEN: ICountryCodes = {
      DE: "Germany",
      IT: "Italy",
      ES: "Spain",
      SE: "Sweden",
    };

    await new Promise((r) => setTimeout(r, 5000));

    const [h1] = await page.$x(
      `//h1[contains(., '${h1s[countryCode]}') or contains(., 'Select a Merchant and Marketplace')]`
    );
    if (h1) {
      const [divBrand] = await page.$x(
        `//div[@class='picker-name'][contains(., 'Zadin')]`
      );
      if (divBrand) {
        // @ts-ignore: Unreachable code error
        await divBrand.click();
        await new Promise((r) => setTimeout(r, 2000));

        const [divCountry] = await page.$x(
          `//div[@class='picker-name'][contains(., '${countries[countryCode]}') or contains(., '${countriesEN[countryCode]}')]`
        );
        if (divCountry) {
          // @ts-ignore: Unreachable code error
          await divCountry.click();
          await new Promise((r) => setTimeout(r, 2000));

          await page.waitForSelector(
            'button[class="picker-switch-accounts-button"]',
            { timeout: 2000 }
          );
          await page.click('button[class="picker-switch-accounts-button"]');

          const cookies_new = await page.cookies();
          await fs.promises.writeFile(
            `src/cookies.json`,
            JSON.stringify(cookies_new, null, 2)
          );

          console.log(
            colors.green(`We are in [${countryCode}]Brand Analytics Dashboard`)
          );
          await new Promise((r) => setTimeout(r, 5000));
        }
      } else {
        throw "[SignIn Step][No Brand found in Brand Dashboard]";
      }
    } else {
      throw "[SignIn Step][Select Brand Dashboard Unavailable]";
    }
  }

  private static async insertOtp(page: Page) {
    let haveCode = false;
    try {
      await page.waitForSelector("#auth-mfa-otpcode", { timeout: 5000 });
      await page.focus("#auth-mfa-otpcode");

      while (!haveCode) {
        new Promise((r) => setTimeout(r, 10000));
        let code = await BrandAnalytics.getOtpCode();
        if (code) {
          await page.keyboard.type(code, { delay: 100 });
          haveCode = true;
          new Promise((r) => setTimeout(r, 5000));
          await BrandAnalytics.invalidateOtpCode(code);
        }
      }

      await page.waitForSelector("#auth-signin-button", {
        timeout: 10000,
      });
      await page.click("#auth-signin-button");
      new Promise((r) => setTimeout(r, 10000));
    } catch (e) {
      console.log(e);
      throw "Otp page not available";
    }
  }

  private static async getOtpCode() {
    const resp = await fetch("http://159.203.116.108/otp/code");
    if (resp.status === 200) {
      const r = await resp.json();
      return r.code ? r.code.code : null;
    }
  }

  private static async invalidateOtpCode(code: string) {
    const resp = await fetch(`http://159.203.116.108/otp/update`, {
      method: "POST",
      body: JSON.stringify({ code }),
      headers: { "Content-Type": "application/json" },
    });
    if (resp.status !== 200) {
      console.log("Error at invalidating the code");
    }
  }
}

import puppeteer, { HTTPResponse } from "puppeteer";
import fs from "fs";
import https from "https";
import crypto from "crypto";
import Report from "./Report";

export default async (headless = false) => {
  const browser = await puppeteer.launch({
    defaultViewport: null,
    headless,
    args: ["--window-size=1440,1080"],
  });
  const page = await browser.newPage();
  const cookiesString = await fs.promises.readFile(`src/cookies.json`);
  const cookies = JSON.parse(cookiesString.toString());
  await page.setCookie(...cookies);

  page.on("dialog", async (dialog) => {
    await new Promise((r) => setTimeout(r, 10000));
    await dialog.accept();
  });
  page.on("response", pageOnResponse());

  return page;
};

const pageOnResponse = () => {
  return (response: HTTPResponse) => {
    if (response.url().startsWith("https://i90downloadv2")) {
      https.get(response.url(), (res) => {
        let filename = `/Users/floriancucu/report/[${global.countryCode}]<${
          global.reportId
        }>${crypto.randomBytes(16).toString("hex")}.csv`;
        const stream = fs.createWriteStream(filename);
        res.pipe(stream);
        stream.on("finish", async () => {
          const report = await Report.parseFromCsv(filename);
          report && report.processReport();
          stream.close();
        });
      });
    }
  };
};

import lunchBrowser from "./lunchBrowser";
import BrandAnalytics from "./BrandAnalytics";
import AmazonReport from "./AmazonReport";
import { PrismaClient } from "@prisma/client";
import Report from "./Report";
import GDriveAPI from "./googleAPI/GDriveAPI";
import moment from "moment";

import * as dotenv from "dotenv";
import GenerateReports from "./GenerateReports";
dotenv.config();

const prisma = new PrismaClient();

class DailytTask {
  constructor() {}
  async execute() {
    const countries = await prisma.country.findMany();
    await GDriveAPI.initialize();
    const page = await lunchBrowser(true);
    for (const country of countries) {
      global.countryCode = country.code;
      let isDone = false;
      global.importFlag = false;
      await BrandAnalytics.goToUrl(page, country.url, country.code);

      // await GenerateReports.insertReportsByDay(
      //   page,
      //   country.id,
      //   moment.utc("2022-08-27").subtract(2, "days")
      // );
      do {
        const report = await Report.getReport(country);
        for (const timeframe of report.timeframes) {
          for (const endDay of timeframe.endDays) {
            for (const department of endDay.departments) {
              global.reportId = department.reportId;
              try {
                await AmazonReport.parse(
                  page,
                  department.reportId,
                  department.name,
                  timeframe.name,
                  endDay.day,
                  country.code
                );
              } catch (err) {
                console.log(err);
              }
              await new Promise((r) => setTimeout(r, 10000));
            }
          }
        }
        isDone = Boolean(report.timeframes.length);
      } while (isDone);
    }
  }
}

(async () => {
  let t = new DailytTask();
  await t.execute();
  await prisma.$disconnect();
  process.exit(1);
})();

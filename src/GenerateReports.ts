import moment, { Moment } from "moment";
import { Page } from "puppeteer";
import AmazonReport from "./AmazonReport";
import BrandAnalytics from "./BrandAnalytics";
import lunchBrowser from "./lunchBrowser";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
type Timeframe = {
  name: "Daily" | "Weekly" | "Monthly" | "Quarterly";
  endDays: {
    day: Date;
    departments: {
      reportId: number;
      name: string;
    }[];
  }[];
};
export default class GenerateReports {
  static async insertReportsByDay(page: Page, countryId: number, day: Moment) {
    const departmentIds = await prisma.department.findMany({
      where: {
        AND: [{ ignoredAt: null }],
      },
      select: { id: true },
    });

    const timeframes = GenerateReports.getTimeframesByDay(day);

    const reportRecords = departmentIds.flatMap((d) =>
      timeframes.map((t) => ({
        countryId,
        departmentId: d.id,
        timeframe: t,
        endDay: day.toDate(),
      }))
    );

    await prisma.report.createMany({
      data: reportRecords,
      skipDuplicates: true,
    });

    console.log(
      `Reports have been inserted for day: ${day.format("YYYY-MM-DD")}`
    );
  }

  private static getTimeframesByDay(day: Moment) {
   //   const timeframes: Timeframe["name"][] = [];
    const timeframes: Timeframe["name"][] = ["Daily"];
    day.isoWeekday() == 6 && timeframes.push("Weekly");
    day.clone().endOf("month").format("YYYY-MM-DD") ==
      day.format("YYYY-MM-DD") && timeframes.push("Monthly");

    // ["03-31", "06-30", "09-30", "12-31"].includes(day.format("MM-DD")) &&
    //   timeframes.push("Quarterly");
    return timeframes;
  }

  static getStartDayFromEndDay(endDay: Date, tf: Timeframe["name"]) {
    switch (tf) {
      case "Weekly":
        return moment.utc(endDay).subtract(6, "days");
      case "Monthly":
        return moment.utc(endDay).startOf("month");
      case "Quarterly":
        return moment.utc(endDay).subtract(2, "months").startOf("month");
      default:
        return moment.utc(endDay);
    }
  }

  static async insertReportsByRange(
    countryId: number,
    startDay: Moment,
    endDay: Moment
  ) {
    const departmentIds = await prisma.department.findMany({
      where: {
        AND: [{ ignoredAt: null }],
      },
      select: { id: true },
    });

    while (endDay.diff(startDay, "days") + 1 > 0) {
      const [validTimeframes, validDepartmentIds] =
        await GenerateReports.validateDay(startDay, departmentIds, countryId);
      const reportRecords = validDepartmentIds.flatMap((d) =>
        validTimeframes.map((t) => ({
          countryId,
          departmentId: d.id,
          timeframe: t,
          endDay: startDay.toDate(),
        }))
      );

      await prisma.report.createMany({
        data: reportRecords,
        skipDuplicates: true,
      });
      startDay.add(1, "days");
    }
    console.log(`Reports have been inserted`);
  }

  private static async validateDay(
    day: Moment,
    departmentIds: { id: number }[],
    countryId: number
  ): Promise<[Timeframe["name"][], { id: number }[]]> {
    const timeframes = GenerateReports.getTimeframesByDay(day);
    const validTimeframes: Timeframe["name"][] = [];
    const validDepartmentIds: { id: number }[] = [];

    for (const department of departmentIds) {
      for (const timeframe of timeframes) {
        const isValidDay = await prisma.departmentRanges.findFirst({
          where: {
            countryId,
            departmentId: department.id,
            timeframe,
            startValidAt: { lte: moment.utc(day).toDate() },
            endValidAt: { gte: moment.utc(day).toDate() },
          },
        });

        isValidDay &&
          validTimeframes.push(timeframe) &&
          validDepartmentIds.push({ id: department.id });
      }
    }

    return [validTimeframes, validDepartmentIds];
  }
}

// (async function () {
//   await GenerateReports.insertReportsByRange(
//     1,
//     moment.utc("2022-09-01"),
//     moment.utc("2022-10-31")
//   );
// })();

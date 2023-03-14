import { Page } from "puppeteer";
import moment, { Moment } from "moment";
import colors from "colors/safe.js";
import GenerateReports from "./GenerateReports";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default class AmazonReport {
  constructor() {}

  static async parse(
    page: Page,
    reportId: number,
    department: string,
    timeframe: Timeframe["name"],
    endDay: Date,
    countryCode: Country["code"]
  ) {
    console.log(
      colors.green(
        `Starting to select configuration for ReportId: ${global.reportId}`
      )
    );
    await AmazonReport.selectDepartment(page, department);
    await AmazonReport.selectTimeframe(page, timeframe);
    await AmazonReport.selectStartDay(page, endDay, timeframe, countryCode);
    await AmazonReport.downloadReport(page, reportId);
  }

  static async downloadReport(page: Page, reportId: number) {
    await page.waitForSelector("#downloadButton", { timeout: 10000 });
    const div = await page.$("#downloadButton");
    // @ts-ignore: Unreachable code error
    const button = await div.$("button");

    // @ts-ignore: Unreachable code error
    const classList = await button.getProperty("classList");
    const classes = await classList.jsonValue();

    if (Object.values(classes).indexOf("awsui-button-disabled") > -1) {
      console.log(colors.red(`ReportID: ${reportId} unavailable`));
      await prisma.report.update({
        where: {
          id: reportId,
        },
        data: {
          attempt: { increment: 1 },
        },
      });
    } else {
      const rows = await page.evaluate(
        () =>
          // @ts-ignore: Unreachable code error
          document.querySelector(
            "div.i90-display-inline-block.i90-viewing-label-container span b"
          ).textContent
      );

      // @ts-ignore: Unreachable code error
      let amz_rws = Number(rows.replace(/,/g, ""));
      let amzRows = amz_rws > 1000000 ? 1000000 : amz_rws;
      let max = Math.min(amzRows, 20);

      let dataCheck = await AmazonReport.getCheckData(
        page,
        Math.floor(Math.random() * max) + 2
      );

      await prisma.report.update({
        where: {
          id: reportId,
        },
        data: {
          verifiedAt: moment().toDate(),
          amzRows,
          dataCheck,
          attempt: { increment: 1 },
        },
      });

      // @ts-ignore: Unreachable code error
      await button.click();
      new Promise((r) => setTimeout(r, 1000));

      // @ts-ignore: Unreachable code error
      const li = await div.$('li[data-testid="searchTermsDetail_csv"]');
      // @ts-ignore: Unreachable code error
      await li.click();

      try {
        await page.waitForSelector(
          "button.i90-report-download-warning-primary-button-div",
          { timeout: 5000 }
        );
        await page.click(
          "button.i90-report-download-warning-primary-button-div"
        );
      } catch {}

      try {
        await page.waitForSelector(
          "awsui-spinner.awsui-button-icon.awsui-button-icon-left",
          { hidden: true, timeout: 240000 }
        );

        const errors = await page.evaluate(() =>
          Array.from(
            document.querySelectorAll("div.a-alert-content"),
            (element) => element.textContent
          )
        );
        if (errors.indexOf("Unable to download report.") < 0) {
          await prisma.report.update({
            where: {
              id: reportId,
            },
            data: {
              downloadedAt: moment().toDate(),
            },
          });
          console.log(
            colors.green(
              `[${moment().format(
                "HH:MM:SS"
              )}]Downloading ReportId: ${reportId}`
            )
          );
        }
      } catch {
        console.log(
          colors.red(
            "[Download]4min timeout exceed. Spinner did not disapear." +
              reportId
          )
        );
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  static async selectTimeframe(page: Page, timeframe: Timeframe["name"]) {
    await page.waitForSelector("#dashboard-filter-reportingRange", {
      timeout: 10000,
    });

    const selectedTimeframe = await page.evaluate(
      () =>
        // @ts-ignore: Unreachable code error
        document.querySelector("#dashboard-filter-reportingRange").textContent
    );

    // @ts-ignore: Unreachable code error
    if (selectedTimeframe.indexOf(timeframe) < 0) {
      await page.click("#dashboard-filter-reportingRange");
      await new Promise((r) => setTimeout(r, 1000));

      const tfSelector = `li[data-testid="${timeframe.toUpperCase()}"]`;

      await page.waitForSelector(tfSelector, { timeout: 10000 });
      await page.click(tfSelector);

      await new Promise((r) => setTimeout(r, 1000));
      await page.waitForSelector(
        "button.awsui-button.awsui-button-variant-primary.awsui-hover-child-icons",
        { timeout: 20000 }
      );

      //Press Apply
      await page.click(
        "button.awsui-button.awsui-button-variant-primary.awsui-hover-child-icons"
      );
      await new Promise((r) => setTimeout(r, 1000));

      //Wait the spinner to disapear
      await page.waitForSelector(
        "div.spinner-outer.a-spinner.a-spinner-medium",
        { hidden: true, timeout: 60000 }
      );
    }
    await await new Promise((r) => setTimeout(r, 1000));
  }

  static async selectDepartment(page: Page, department: string) {
    let pressApply = true;

    await page.waitForSelector("#dashboard-filter-department", {
      timeout: 10000,
    });
    await page.click("#dashboard-filter-department");
    await new Promise((r) => setTimeout(r, 1000));
    const span = await page.$("#dashboard-filter-department");

    // @ts-ignore: Unreachable code error
    const strong = await span.$("strong");
    const strongText = await page.evaluate(
      // @ts-ignore: Unreachable code error
      (element) => element.textContent,
      strong
    );
    if (department === strongText) {
      pressApply = false;
    }
    // @ts-ignore: Unreachable code error
    const li = await span.$(`li[data-testid="${department}"]`);
    if (!li) {
      throw `Department: ${department} is not available!`;
    }
    await li.click();

    await new Promise((r) => setTimeout(r, 2000));
    if (pressApply) {
      await page.waitForSelector(
        "button.awsui-button.awsui-button-variant-primary.awsui-hover-child-icons",
        { timeout: 10000 }
      );
      await page.click(
        "button.awsui-button.awsui-button-variant-primary.awsui-hover-child-icons"
      );
      await new Promise((r) => setTimeout(r, 1000));
    }

    //Wait the spinner to disapear
    await page.waitForSelector("div.spinner-outer.a-spinner.a-spinner-medium", {
      hidden: true,
      timeout: 60000,
    });
  }

  static async selectStartDay(
    page: Page,
    endDay: Date,
    timeframe: Timeframe["name"],
    countryCode: Country["code"]
  ) {
    let pressApply = true;
    const startDate = GenerateReports.getStartDayFromEndDay(endDay, timeframe);

    await page.waitForSelector("#dashboard-filter-periodPicker", {
      timeout: 10000,
    });
    await page.click("#dashboard-filter-periodPicker");
    await new Promise((r) => setTimeout(r, 1000));
    const span = await page.$("#dashboard-filter-periodPicker");

    if (timeframe !== "Quarterly") {
      //If startDate is equal with already selected date, don't need to press Apply
      // @ts-ignore: Unreachable code error
      const input = await span.$(
        "input.date-picker-input.i90-pointer.react-datepicker-ignore-onclickoutside"
      );
      const inputValue = await page.evaluate(
        // @ts-ignore: Unreachable code error
        (element) => element.value,
        input
      );

      let formatDate = "DD/MM/YY";
      if (countryCode == "US" || countryCode == "MX") formatDate = "MM/DD/YY";
      else if (countryCode == "CA") formatDate = "YY-MM-DD";
      // console.log(moment(strongText,formatDate).format('YYYY-MM-DD'))
      if (
        startDate.format("YYYY-MM-DD") ===
        moment(inputValue, formatDate).format("YYYY-MM-DD")
      ) {
        pressApply = false;
      }
      //---

      await page.waitForSelector("div.react-datepicker__current-month", {
        timeout: 10000,
      });
      const currentFirstMonth = (
        await page.evaluate(() =>
          Array.from(
            document.querySelectorAll("div.react-datepicker__current-month"),
            (element) => element.textContent
          )
        )
      )[0];

      let totalMonthDiff = AmazonReport.monthDiference(
        currentFirstMonth!,
        startDate.format("YYYY-MM-DD")
      );
      if (totalMonthDiff < 0) {
        await AmazonReport.moveMonths(page, Math.abs(totalMonthDiff), "fw");
      }
      await AmazonReport.moveMonths(page, totalMonthDiff, "bk");

      await page.waitForSelector("div.react-datepicker__week", {
        timeout: 4000,
      });
      ``;
      const weekRows = await page.$$("div.react-datepicker__week");

      const currentDay = moment(startDate, "YYYY-MM-DD").format("D");
      const dayToSelect = await weekRows[AmazonReport.getWeekRow(startDate)].$(
        `div[aria-label="day-${currentDay}"]`
      );

      // @ts-ignore: Unreachable code error
      const classList = await dayToSelect.getProperty("classList");
      const classes = await classList.jsonValue();

      if (
        Object.values(classes).indexOf("react-datepicker__day--disabled") > -1
      ) {
        throw `Date: ${startDate} in tf: ${timeframe} is disabled!`;
      } else {
        // @ts-ignore: Unreachable code error
        await dayToSelect.click();
        await new Promise((r) => setTimeout(r, 1000));
      }
    } else {
      //If startDate is equal with already selected date, don't need to press Apply
      // @ts-ignore: Unreachable code error
      const strong = await span.$("strong");
      const strongText = await page.evaluate(
        // @ts-ignore: Unreachable code error
        (element) => element.textContent,
        strong
      );

      //CA 22-04-03 so YY-MM-DD
      //US 04/03/22 so MM/DD/YY
      //MX 04/03/22 so MM/DD/YY
      //Rest 03/04/22 so DD/MM/YY

      let formatDate = "DD/MM/YY";
      if (countryCode == "US" || countryCode == "MX") formatDate = "MM/DD/YY";

      if (
        startDate.format("YYYY-MM-DD") ===
        moment(strongText, formatDate).format("YYYY-MM-DD")
      ) {
        pressApply = false;
      }
      //----
      // @ts-ignore: Unreachable code error
      const div = await span.$("div.awsui-button-dropdown-container");

      // @ts-ignore: Unreachable code error
      await div.click();
      await new Promise((r) => setTimeout(r, 1000));

      const currentDay = startDate.format("YYYYMMDD");
      // @ts-ignore: Unreachable code error
      const li = await span.$(`li[data-testid="${currentDay}"]`);

      if (!li) {
        throw `Date: ${startDate} in tf: ${timeframe} is not available!`;
      }

      await li.click();
    }

    if (pressApply) {
      //Click Apply
      await page.waitForSelector(
        "button.awsui-button.awsui-button-variant-primary.awsui-hover-child-icons",
        { timeout: 10000 }
      );
      await page.click(
        "button.awsui-button.awsui-button-variant-primary.awsui-hover-child-icons"
      );

      //Wait the spinner to disapear
      await page.waitForSelector(
        "div.spinner-outer.a-spinner.a-spinner-medium",
        { hidden: true, timeout: 60000 }
      );
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  private static monthDiference(startDate: string, endDate: string) {
    let months;
    const startDateYear = parseInt(
      moment(startDate, "MMMM YYYY").format("YYYY")
    );
    const endDateYear = parseInt(moment(endDate).format("YYYY"));
    const startDateMonth = parseInt(moment(startDate, "MMMM YYYY").format("M"));
    const endDateMonth = parseInt(moment(endDate).format("M"));
    months = (startDateYear - endDateYear) * 12;
    months += startDateMonth;
    months -= endDateMonth;
    return months;
  }

  static async getAllDepartments(page: Page) {
    await page.waitForSelector("#dashboard-filter-department", {
      timeout: 10000,
    });
    await page.click("#dashboard-filter-department");
    await new Promise((r) => setTimeout(r, 1000));
    const span = await page.$("#dashboard-filter-department");

    // @ts-ignore: Unreachable code error
    const ul = await span.$("ul.awsui-button-dropdown-items");
    // @ts-ignore: Unreachable code error
    const departments = await ul.evaluate(() =>
      Array.from(
        document.querySelectorAll("li.awsui-button-dropdown-item"),
        (element) => ({
          name: element.getAttribute("data-testid"),
        })
      )
    );
    await page.click("#dashboard-filter-department");
    await new Promise((r) => setTimeout(r, 500));

    return departments;
  }

  private static async moveMonths(
    page: Page,
    noOfMonth: number,
    direction: "fw" | "bk"
  ) {
    let selector =
      "a.react-datepicker__navigation.react-datepicker__navigation--previous";
    if (direction === "fw") {
      selector =
        "a.react-datepicker__navigation.react-datepicker__navigation--next";
    }

    for (let index = 0; index < noOfMonth; index++) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
      } catch (err) {
        throw `[moveMonths]:${err}`;
      }
      await page.click(selector);
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  private static getWeekRow(startDate: Moment) {
    const dayOfWeekCurrentDay = startDate.day();
    const dayOfMonthCurrentDay = parseInt(startDate.format("D"));
    return Math.trunc((dayOfMonthCurrentDay + (5 - dayOfWeekCurrentDay)) / 7);
  }

  private static async getCheckData(
    page: Page,
    rowNumber: number
  ): Promise<DataReport["dataCheck"]> {
    const rowContainer = await page.$(`[aria-rowindex="${rowNumber}"]`);
    // const rowContainer = await page.$(`[aria-rowindex="30"]`);
    const fieldsContainer = await rowContainer?.$$(
      ".fixedDataTableCellGroupLayout_cellGroup"
    );
    if (fieldsContainer?.length) {
      const fields = await fieldsContainer[1].$$(
        ".fixedDataTableCellLayout_main.public_fixedDataTableCell_main"
      );

      if (fields.length) {
        const innerPropKeyword = await fields[0].getProperty("textContent");
        const innerValueKeyword = await innerPropKeyword.jsonValue();

        const innerPropRank = await fields[1].getProperty("textContent");
        const innerValueRank = await innerPropRank.jsonValue();

        const innerPropAsin1 = await fields[2].getProperty("textContent");
        const innerValueAsin1 = await innerPropAsin1.jsonValue();
        return {
          sterm: innerValueKeyword?.trim(),
          rank: Number(innerValueRank?.trim()),
          asin1: innerValueAsin1?.trim(),
        };
      }
    }
  }
}

// (async () => {
//   const page = await lunchBrowser();
//   await BrandAnalytics.goToUrl(
//     page,
//     "https://sellercentral.amazon.com/analytics/dashboard/searchTerms",
//     "US"
//   );

//   await AmazonReport.insertNextDayReports(page, 1, moment.utc("2022-09-16"));
// })();

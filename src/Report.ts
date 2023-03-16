import readline from "readline";
import fs from "fs";
import { exec } from "child-process-promise";
import { quote } from "shell-quote";
import colors from "colors/safe.js";
import path from "path";
import { Country, PrismaClient } from "@prisma/client";
import GDriveAPI from "./googleAPI/GDriveAPI";
import moment from "moment";
import GenerateReports from "./GenerateReports";
import PrismaMap from "./PrismaMap";

import * as dotenv from "dotenv";
import { timeStamp } from "console";
dotenv.config();

const prisma = new PrismaClient();
type AmzReport = {
  country: Country;
  timeframes: Timeframe[];
};

type DataReport = {
  filepath: string;
  reportId: number;
  countryCode: Country["code"];
  countryFolderId: string;
  department: string;
  departmentId: number;
  timeframe: Timeframe["name"];
  endDay: Date;
  dataCheck: any ;
  size: number;
};

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

type FilterReport = {
  attempt: { [key in "min" | "max"]: number };
  range: { [key in "min" | "max"]: Date };
};


export default class Report {
  private id: number;
  private department: string;
  private departmentId: number;
  private countryCode: Country["code"];
  private countryFolderId: string;
  private timeframe: Timeframe["name"];
  private endDay: Date;
  private filepath: string;
  private size: number;
  private dataCheck: DataReport["dataCheck"];

  constructor(reportData: DataReport) {
    this.id = reportData.reportId;
    this.department = reportData.department;
    this.departmentId = reportData.departmentId;
    this.countryCode = reportData.countryCode;
    this.countryFolderId = reportData.countryFolderId;
    this.timeframe = reportData.timeframe;
    this.endDay = reportData.endDay;
    this.filepath = reportData.filepath;
    this.size = reportData.size;
    this.dataCheck = reportData.dataCheck;
    PrismaMap.setModels(this.countryCode, this.timeframe);
  }

  static async getReport(
    country: Country,
    filters: FilterReport = {
      attempt: { min: -1, max: 3 },
      range: {
        min: new Date("2017-12-01"),
        max: moment.utc("2022-09-27").subtract(3, "days").toDate(),
      },
    }
  ) {
    const rawReports = await prisma.report.findMany({
      where: {
        AND: [
          { countryId: country.id },
          {
            OR: [
              { verifiedAt: null },
              { downloadedAt: null },
              // { checkedAt: null },
              // { uploadedAt: null },
            ],
          },
          { attempt: { lt: filters.attempt.max } },
          { attempt: { gt: filters.attempt.min } },
          { endDay: { lte: filters.range.max } },
          { endDay: { gt: filters.range.min } },
        ],
      },
      select: {
        id: true,
        department: {
          select: { name: true },
        },
        timeframe: true,
        endDay: true,
      },
    });

    const report: AmzReport = {
      country,
      timeframes: [],
    };

    for (const raw of rawReports) {
      let foundTf = report.timeframes.find((tf) => tf.name === raw.timeframe);
      if (foundTf) {
        let foundDay = foundTf.endDays.find(
          (endDay) => endDay.day.getTime() === raw.endDay.getTime()
        );
        if (foundDay) {
          foundDay.departments.push({
            reportId: raw.id,
            name: raw.department.name,
          });
        } else {
          foundTf.endDays.push({
            day: raw.endDay,
            departments: [
              {
                reportId: raw.id,
                name: raw.department.name,
              },
            ],
          });
        }
      } else {
        report.timeframes.push({
          name: raw.timeframe,
          endDays: [
            {
              day: new Date(raw.endDay),
              departments: [
                {
                  reportId: raw.id,
                  name: raw.department.name,
                },
              ],
            },
          ],
        });
      }
    }

    return report;
  }

  public static async parseFromCsv(filepath: string) {
    // @ts-ignore: Unreachable code error
    const countryCode: Country["code"] = filepath.match(
      /(US|MX|CA|GB|DE|IT|FR|ES|SE|AU|NL|AE|BR|IN|JP|SA|SG|TR)/
    )![1];
    const reportId = Number(filepath.match(/<(.*?)>/)![1]);
    const lines = await Report.readLines(filepath, 10);
    let department,
      interval,
      extraRows = null;
    let timeframe: Timeframe["name"];
    if (countryCode != "CA") {
      department = lines[0].match(/"Department=\[(.*?)\]"/)![1];
      // @ts-ignore: Unreachable code error
      timeframe = lines[0].match(/"Reporting Range=\[(\w+)\]"/)![1];
      interval = lines[0].match(/"Viewing=\[(.+)\s-\s(.+)]/);
      extraRows = 2;
    } else {
      department = lines[3].match(/=\[(.*?)\]"/)![1];
      // @ts-ignore: Unreachable code error
      timeframe = lines[4].match(/"Reporting Range=\[(\w+)\]"/)![1];
      interval = lines[4].match(/"Viewing=\[(.+)\s-\s(.+)]/);
      extraRows = 7;
    }

    const getFormat = (countryCode: Country["name"]) => {
      switch (countryCode) {
        case "US":
          return "M/D/YY";
        case "MX":
          return "MM/DD/YY";
        default:
          return "DD/MM/YY";
      }
    };

    const endDay = moment.utc(interval![2], getFormat(countryCode)).toDate();

    const result = await exec(`sed -n '$=' ${quote([filepath])}`, {
      encoding: "utf8",
      timeout: 10000,
    });
    const amzRows = Number(result.stdout) - extraRows;
    const stat = await fs.promises.stat(filepath);

    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        timeframe,
        endDay,
        amzRows,
        checkedAt: null,
        department: {
          name: department,
        },
        country: {
          code: countryCode,
        },
      },
      select: {
        dataCheck: true,
        country: {
          select: {
            googleFolderId: true,
          },
        },
        department: {
          select: {
            id: true,
          },
        },
      },
    });

    if (report) {
      await prisma.report.update({
        where: {
          id: reportId,
        },
        data: {
          size: stat.size,
        },
      });
      return new Report({
        filepath,
        reportId,
        countryCode,
        countryFolderId: report.country.googleFolderId,
        department,
        departmentId: report.department.id,
        timeframe,
        endDay,
        dataCheck: report.dataCheck,
        size: stat.size,
      });
    } else {
      console.log(colors.red("Duplicate Or Not found ReportId: " + reportId));
      return;
    }
  }

  private static async readLines(
    filepath: string,
    wantedLines: number
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      let lineCounter = 0;
      let lines: string[] = [];
      let lineReader = readline.createInterface({
        input: fs.createReadStream(filepath),
      });
      lineReader.on("line", function (line) {
        lineCounter++;
        lines.push(line);
        if (lineCounter == wantedLines) {
          lineReader.close();
          lineReader.removeAllListeners();
        }
      });
      lineReader.on("close", function () {
        resolve(lines);
      });
    });
  }

  static async importToDb(
    endDay: Date,
    filepath: string,
    countryCode: Country["code"],
    timeframe: Timeframe["name"],
    reportId: number,
    department: string
  ) {
    const sqlFile = "importRawCsv.sql";

    (await fs.promises.stat(sqlFile).then(
      () => true,
      () => false
    )) && (await fs.promises.unlink(sqlFile));
    const sqlCommand = `
       TRUNCATE TABLE \`temps\`;
    
       LOAD DATA LOCAL INFILE '${filepath}'
       INTO TABLE temps
       CHARACTER SET UTF8
       FIELDS TERMINATED BY ','
       ENCLOSED BY '\\"'
       LINES TERMINATED BY '\\n'
       IGNORE ${countryCode != "CA" ? 2 : 7} LINES;
 
      DELETE t1 FROM temps t1
      INNER JOIN temps t2 
      WHERE 
      t1.id > t2.id AND 
      t1.search_term = t2.search_term; 

      INSERT IGNORE INTO US_keywords (sterm) SELECT search_term from temps order by id ASC;

      INSERT IGNORE INTO US_asins (name)  
	    SELECT distinct(asin) FROM 
      (SELECT asin1 asin from temps 
      UNION	
      SELECT asin2 asin from temps
      UNION
      SELECT asin3 asin from temps
      ) t
      where asin <> 'null';

      INSERT IGNORE INTO US_${timeframe.toLowerCase()}_ranks (keywordId, rankV, departmentId, reportId)
      select u.id, replace(t.rankV, ",",""),1,${reportId} from temps t
      INNER JOIN US_keywords u ON u.sterm = t.search_term;

      INSERT IGNORE INTO US_${timeframe.toLowerCase()}_asin_keywords (asinId,keywordId,asinRank,reportId)
      (select a.id, k.id, 1, ${reportId} from temps t
      INNER JOIN US_keywords k ON t.search_term = k.sterm
      INNER JOIN US_asins a ON a.name = t.asin1
      WHERE t.asin1 <> 'null')
      UNION 
      (select a.id, k.id, 2,${reportId} from temps t
      INNER JOIN US_keywords k ON t.search_term = k.sterm
      INNER JOIN US_asins a ON a.name = t.asin2
      WHERE t.asin2 <> 'null')
      UNION
      (select a.id, k.id, 3,${reportId} from temps t
      INNER JOIN US_keywords k ON t.search_term = k.sterm
      INNER JOIN US_asins a ON a.name = t.asin3 
      WHERE t.asin3 <> 'null') 
       
    `;

    try {
      await fs.promises.writeFile("importRawCsv.sql", sqlCommand);
      let result = await exec(
        `${process.env.MYSQL_IMPORT_COMMAND} < ${sqlFile}`,
        {
          encoding: "utf8",
        }
      );
      console.log(
        colors.green(
          `[${moment().format(
            "HH:mm"
          )}]Import to DB ReportId: ${reportId} [${countryCode}][${department}][${timeframe}][${moment(
            endDay
          ).format("YYYY-MM-DD")}][stdout:${result.stdout}]`
        )
      );

      await prisma.report.update({
        where: {
          id: reportId,
        },
        data: {
          importedAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error("[Report->import()]: Import to DB Error: " + error);
    }
  }

  private async upload(filepath: string) {
    let uploadFolderId = null;
    let { files } = await GDriveAPI.getFolderByName(
      `[${this.countryCode}1][${this.department}][${this.timeframe}]`
    );

    if (files.length) {
      uploadFolderId = files[0].id;
    } else {
      ({ files } = await GDriveAPI.getFolderByName(
        `[${this.countryCode}1][${this.department}]`
      ));
      let departmentFolder = null;

      if (files.length) departmentFolder = files[0];
      else
        departmentFolder = await GDriveAPI.createFileInParent(
          `[${this.countryCode}1][${this.department}]`,
          this.countryFolderId,
          "application/vnd.google-apps.folder"
        );

      let timeframeFolder = await GDriveAPI.createFileInParent(
        `[${this.countryCode}1][${this.department}][${this.timeframe}]`,
        departmentFolder.id,
        "application/vnd.google-apps.folder"
      );

      uploadFolderId = timeframeFolder.id;
    }
    try {
      let { id, size } = await GDriveAPI.createFileInParent(
        path.basename(filepath),
        uploadFolderId,
        "text/csv",
        filepath
      );
      if (size == this.size) {
        await prisma.report.update({
          where: {
            id: this.id,
          },
          data: {
            gid: id,
            uploadedAt: new Date(),
          },
        });
        console.log(
          colors.blue(
            `[${moment().format("HH:MM:SS")}]Upload ReportId: ${
              this.id
            } to ${id} with size: ${this.size}`
          )
        );
      } else {
        await GDriveAPI.deleteFileById(id);
        throw new Error(
          `[Report->upload()]: Size not match for ReportId:${this.id}`
        );
      }
    } catch (err) {
      throw new Error(
        "[Report->upload()]: Upload to Google Drive Error: " + err
      );
    }
  }

  async processReport() {
    const newPath = `${path.dirname(this.filepath)}/[${this.countryCode}][${
      this.department
    }][${this.timeframe}][${moment(
      GenerateReports.getStartDayFromEndDay(this.endDay, this.timeframe)
    ).format("YYYY-MM-DD")}][${this.id}].csv`;

    try {
      await Report.importToDb(
        this.endDay,
        this.filepath,
        this.countryCode,
        this.timeframe,
        this.id,
        this.department
      );
      await this.checkRankData();
      await fs.promises.rename(this.filepath, newPath);
      await this.upload(newPath);
      fs.promises.unlink(newPath);
    } catch (err) {
      err instanceof Error && console.log(colors.red(err.message));
    }
  }

  private async checkRankData() {
    let keyword: any = {
      select: {
        sterm: true,
      },
    };
    let rankKey: string;
    switch (this.timeframe) {
      case "Weekly":
        keyword.select.weeklyRanks = { select: { rank: true } };
        rankKey = "weeklyRanks";
        break;
      case "Monthly":
        keyword.select.monthlyRanks = {
          select: { rank: true, reportId: true },
        };
        rankKey = "monthlyRanks";
        break;
      default:
        keyword.select.dailyRanks = { select: { rank: true, reportId: true } };
        rankKey = "dailyRanks";
    }

    try {
      let keyword = await PrismaMap.rank.findFirst({
        where: {
          reportId: this.id,
          keyword: {
            is: { sterm: this.dataCheck.sterm },
          },
        },
        select: {
          rank: true,
        },
      });
      let asin = await PrismaMap.asinKeyword.findFirst({
        where: {
          reportId: this.id,
          asin: {
            is: { name: this.dataCheck.asin1 },
          },
          keyword: {
            is: { sterm: this.dataCheck.sterm },
          },
        },
        select: {
          asinRank: true,
        },
      });

      if (asin && asin.asinRank == 1 && keyword?.rank == this.dataCheck.rank) {
        // de verificat si nr de intrari in rank
        await prisma.report.update({
          where: {
            id: this.id,
          },
          data: {
            checkedAt: moment().toDate(),
          },
        });
        console.log(
          colors.green(
            `[${moment().format("HH:MM:SS")}]Checked ReportId: ${this.id}`
          )
        );
        return;
      }

      // await PrismaMap.asinKeyword.deleteMany({
      //   where: {
      //     reportId: this.id,
      //   },
      // });
      // await PrismaMap.rank.deleteMany({
      //   where: {
      //     reportId: this.id,
      //   },
      // });
      throw new Error(
        `Rank data check not match - ReportId: ${this.id} discarded`
      );
    } catch (error) {
      throw new Error(`[CheckData ReportID: ${this.id}]: ${error}`);
    }
  }
}

// (async () => {
//   await GDriveAPI.initialize();

//   let r = await Report.parseFromCsv(
//     "/Users/floriancucu/report/[US]<2>[Baby][Daily][2022-08-24][9].csv"
//   );
//   PrismaMap.setModels("US", "Daily");

//   r && r.processReport();
// })();

// (async () => {
//   const country = await prisma.country.findFirst({ where: { code: "US" } });
//   const report = await Report.getReport(country!);
//   console.log(report);
// })();

// (async () => {
//   const report = await prisma.usDailyAsinKeywords.findFirst({
//     where: {
//       reportId: 59,
//       asin: {
//         is: { name: "1501110365" },
//       },
//       keyword: {
//         is: { sterm: "books" },
//       },
//     },
//     select: {
//       asinRank: true,
//       id: true,
//     },
//   });

//   console.log(report);
// })();


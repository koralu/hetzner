import GDriveAPI from "./googleAPI/GDriveAPI";
import GenerateReports from "./GenerateReports";
import Report from "./Report";
import fs from "fs";
import colors from "colors/safe.js";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

(async () => {
  await GDriveAPI.initialize();
  const reports = await prisma.report.findMany({
    where: {
      importedAt: null,
    },
    select: {
      id: true,
      country: {
        select: { code: true },
      },
      department: {
        select: { name: true },
      },
      timeframe: true,
      endDay: true,
    },
  });

  for (const report of reports) {
    let statDay = GenerateReports.getStartDayFromEndDay(
      report.endDay,
      report.timeframe
    ).format("YYYY-MM-DD");
    let reportName = `[${report.country.code}][${report.department.name}][${report.timeframe}][${statDay}]`;

    const f = await GDriveAPI.getFileByName(reportName);

    if (f[0]) {
      await GDriveAPI.downloadFileById(f[0].id, `${f[0].id}.csv`);
      await Report.importToDb(
        report.endDay,
        `${f[0].id}.csv`,
        report.country.code,
        report.timeframe,
        report.id,
        report.department.name
      );
      fs.promises.unlink(`${f[0].id}.csv`);
    } else {
      console.log(colors.red(`${reportName} UNAVAILABLE`));
    }
  }
  process.exit(1);
})();

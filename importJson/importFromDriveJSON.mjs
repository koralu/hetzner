import {downloadFileById, getFileByName} from './googleAPI/gdrive-api.mjs'
import fs from "fs";
import colors from "colors/safe.js";
import moment from 'moment';
import importJson from './parse.js';
import prepareSQL from './prepareSQL.mjs';

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

console.log(
  colors.green(
    `       Start Import at [${moment().format(
      "HH:mm"
    )}]`
  )
);

(async () => {
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
    let statDay = getStartDayFromEndDay(
      report.endDay,
      report.timeframe
    ).format("YYYY-MM-DD");
    let reportName = `[${report.country.code}][${report.department.name}][${report.timeframe}][${statDay}]`;

    const f = await getFileByName(reportName);

    if (f[0]) {
      await downloadFileById(f[0].id, `${f[0].id}.json`);
      await importJson(`${f[0].id}.json`);
      await prepareSQL(report.timeframe, report.id, report.endDay );
      fs.promises.unlink(`${f[0].id}.json`);
    } else {
      console.log(colors.red(`${reportName} UNAVAILABLE`));
    }
  }
  process.exit(1);
})();

const getStartDayFromEndDay = (endDay, tf) => {
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
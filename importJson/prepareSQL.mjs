import { PrismaClient } from "@prisma/client";
import fs from "fs";
import colors from "colors/safe.js";
import moment from 'moment';
import { exec } from "child-process-promise";

const prisma = new PrismaClient();

const prepareSQL = async (timeframe, reportId, endDay) => {
   const sqlFile = "importJSON.sql";
   (await fs.promises.stat(sqlFile).then(
      () => true,
      () => false
    )) && (await fs.promises.unlink(sqlFile));

    const sqlCommand = `
    INSERT IGNORE INTO US_keywords (sterm) SELECT keyword FROM _keywordRankTemp kt;
      INSERT IGNORE INTO US_asins (name) SELECT distinct(asin) from _asinKeywordRankTemp;

      DELETE t1 FROM _keywordRankTemp t1
      INNER JOIN _keywordRankTemp t2 
      WHERE 
      t1.id > t2.id AND 
      t1.keyword = t2.keyword;

      DELETE t1 FROM _asinKeywordRankTemp t1
      INNER JOIN _asinKeywordRankTemp t2 
      WHERE 
      t1.id > t2.id AND 
      t1.keyword = t2.keyword AND t1.asinRank= t2.asinRank;

      INSERT IGNORE INTO US_${timeframe.toLowerCase()}_ranks (keywordId, rankV, departmentId, reportId)
      SELECT k.id, kt.rankV, 1, ${reportId} FROM _keywordRankTemp kt
      INNER JOIN US_keywords k ON kt.keyword = k.sterm;

      INSERT IGNORE INTO US_${timeframe.toLowerCase()}_asin_keywords (asinId, keywordId, asinRank, reportId)
      SELECT a.id, k.id, arkt.asinRank, ${reportId} FROM _asinKeywordRankTemp arkt
      INNER JOIN US_keywords k ON arkt.keyword = k.sterm
      INNER JOIN US_asins a ON arkt.asin = a.name;

     TRUNCATE TABLE \`_keywordRankTemp\`;
      TRUNCATE TABLE \`_asinKeywordRankTemp\`;
    `

    try {
      await fs.promises.writeFile("importJSON.sql", sqlCommand);
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
          )}]Import JSON to DB ReportId: ${reportId} [${timeframe}][${moment(
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

export default prepareSQL;
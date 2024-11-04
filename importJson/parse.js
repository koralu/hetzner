const { chain } = require("stream-chain");
const { parser } = require("stream-json");
const { pick } = require("stream-json/filters/Pick");
const { streamArray } = require("stream-json/streamers/StreamArray");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const importJson = (fileName) => {
  return new Promise((resolve) => {

    const pipeline = chain([
      fs.createReadStream(fileName),
      parser(),
      pick({ filter: "dataByDepartmentAndSearchTerm" }),
      streamArray(),
      (data) => {
        return data;
      },
    ]);
    let asinKeywordRank = [];
    let keywordRank = [];
    let kRank = 0;
    let kKeyword = '';
    
    (async () => {
      let chunk = 0;
      for await (const s of pipeline) {
        if (chunk > 1000) {
          await createKeywordRankSql(keywordRank);
          await createAsinKeywordRankSql(asinKeywordRank);
          chunk = 0;
          keywordRank = [];
          asinKeywordRank = [];
        }
        asinKeywordRank.push({
          asin: s.value.clickedAsin,
          asinRank: s.value.clickShareRank,
          keyword: s.value.searchTerm,
        });
        if (kKeyword != s.value.searchTerm) {
          keywordRank.push({
            keyword: s.value.searchTerm,
            rankV: s.value.searchFrequencyRank,
          });
          kRank = s.value.searchFrequencyRank;
          kKeyword = s.value.searchTerm;
        }
        chunk++;
      }
      await createKeywordRankSql(keywordRank);
      await createAsinKeywordRankSql(asinKeywordRank);
      resolve()
    })()
    
    const createKeywordRankSql = async (keywordRank) => {
      await prisma.keywordRankTemp.createMany({
        data: keywordRank,
      });
    };
    
    const createAsinKeywordRankSql = async (asinKeywordRank) => {
      await prisma.asinKeywordRankTemp.createMany({
        data: asinKeywordRank,
      });
    };
  })
}

module.exports = importJson;

    // pipeline.on("end", () => {
    //   createKeywordRankSql(keywordRank);
    //   createAsinKeywordRankSql(asinKeywordRank);
    //   resolve()
    // });

    // pipeline.on("data",  async (s) => {
    //   if (chunk > 5000) {
    //      await createKeywordRankSql(keywordRank);
    //      await createAsinKeywordRankSql(asinKeywordRank);
    //     chunk = 0;
    //     keywordRank = [];
    //     asinKeywordRank = [];
    //   }
    //   asinKeywordRank.push({
    //     asin: s.value.clickedAsin,
    //     asinRank: s.value.clickShareRank,
    //     keyword: s.value.searchTerm,
    //   });
    //   if (kRank != s.value.searchFrequencyRank) {
    //     keywordRank.push({
    //       keyword: s.value.searchTerm,
    //       rankV: s.value.searchFrequencyRank,
    //     });
    //     kRank = s.value.searchFrequencyRank;
    //   }
    //   chunk++;
    // });
    
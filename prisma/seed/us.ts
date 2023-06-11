import { PrismaClient } from "@prisma/client";
import GenerateReports from "../../src/GenerateReports";
import moment from "moment";
const prisma = new PrismaClient();

export default async () => {

  await prisma.country.create({
    data: {
      name: "United States",
      code: "US",
      dateFormat: "m/d/y",
      url: "https://sellercentral.amazon.com/analytics/dashboard/searchTerms",
      mainDepartmentId: 1,
      marketplaceId: "ATVPDKIKX0DER",
      googleFolderId: "1SGmhnb3VPn26vQFkGoaauiAfZE5B0O8K",
      departmentRanges:{
        create: [
          {
            department: {
              connectOrCreate: {
                where: { name: "Amazon.com" },
                create: { name: "Amazon.com", slug: "Amazon.com" },
              },
            },
            timeframe: "Daily",
            startValidAt: new Date("2022-01-01"),
            endValidAt: new Date("2023-02-28"),
          },
          {
            department: {
              connectOrCreate: {
                where: { name: "Amazon.com" },
                create: { name: "Amazon.com", slug: "Amazon.com" },
              },
            },
            timeframe: "Weekly",
            startValidAt: new Date("2020-11-29"),
            endValidAt: new Date("2023-02-28"),
          },
          {
            department: {
              connectOrCreate: {
                where: { name: "Amazon.com" },
                create: { name: "Amazon.com", slug: "Amazon.com" },
              },
            },
            timeframe: "Monthly",
            startValidAt: new Date("2018-11-01"),
            endValidAt: new Date("2023-02-28"),
          },
        ],
      }
      
    },
  });

  await GenerateReports.insertReportsByRange(
    1,
    moment.utc("2022-08-01"),
    moment.utc("2023-02-28")
  );
};

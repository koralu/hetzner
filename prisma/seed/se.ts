import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async () => {
  await prisma.country.create({
    data: {
      name: "Sweden",
      code: "SE",
      dateFormat: "d/m/y",
      url: "https://sellercentral.amazon.se/analytics/dashboard/searchTerms",
      mainDepartmentId: 7,
      marketplaceId: "A2NODRKZP88ZB9",
      googleFolderId: "uktt",
      reports: {
        create: [
          {
            department: {
              connectOrCreate: {
                where: { name: "Amazon.se" },
                create: { id: 7, name: "Amazon.se" },
              },
            },
            timeframe: "Daily",
            endDay: new Date("2022-08-20"),
            attempt: 0,
          },
          {
            department: {
              connectOrCreate: {
                where: { name: "Amazon.se" },
                create: { name: "Amazon.se" },
              },
            },
            timeframe: "Weekly",
            endDay: new Date("2022-08-20"),
            attempt: 0,
          },
          {
            department: {
              connectOrCreate: {
                where: { name: "Amazon.se" },
                create: { name: "Amazon.se" },
              },
            },
            timeframe: "Monthly",
            endDay: new Date("2022-08-31"),
            attempt: 0,
          },
          {
            department: {
              connectOrCreate: {
                where: { name: "Amazon.se" },
                create: { name: "Amazon.se" },
              },
            },
            timeframe: "Quarterly",
            endDay: new Date("2022-06-30"),
            attempt: 0,
          },
        ],
      },
    },
  });
};

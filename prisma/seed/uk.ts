import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async () => {
  await prisma.country.create({
    data: {
      name: "United Kingdom",
      code: "GB",
      dateFormat: "d/m/y",
      url: "https://sellercentral.amazon.co.uk/analytics/dashboard/searchTerms",
      mainDepartmentId: 2,
      marketplaceId: "A1F83G8C2ARO7P",
      googleFolderId: "uktt",
      reports: {
        create: [
          {
            department: {
              connectOrCreate: {
                where: { name: "Baby" },
                create: { name: "Baby" },
              },
            },
            timeframe: "Daily",
            endDay: new Date("2022-08-20"),
            attempt: 0,
          },
          {
            department: {
              connectOrCreate: {
                where: { name: "Baby" },
                create: { name: "Baby" },
              },
            },
            timeframe: "Weekly",
            endDay: new Date("2022-08-20"),
            attempt: 0,
          },
          {
            department: {
              connectOrCreate: {
                where: { name: "Baby" },
                create: { name: "Baby" },
              },
            },
            timeframe: "Monthly",
            endDay: new Date("2022-08-31"),
            attempt: 0,
          },
          {
            department: {
              connectOrCreate: {
                where: { name: "Baby" },
                create: { name: "Baby" },
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

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async () => {
  await prisma.country.create({
    data: {
      name: "Netherlands",
      code: "NL",
      dateFormat: "d/m/y",
      url: "https://sellercentral.amazon.nl/analytics/dashboard/searchTerms",
      mainDepartmentId: 85,
      marketplaceId: "A1805IZSGTT6HS",
      googleFolderId: "uktt",
      reports: {
        create: [
          {
            department: {
              connectOrCreate: {
                where: { name: "Amazon.nl" },
                create: { id: 85, name: "Amazon.nl" },
              },
            },
            timeframe: "Daily",
            endDay: new Date("2022-08-20"),
            attempt: 0,
          },
          {
            department: {
              connectOrCreate: {
                where: { name: "Amazon.nl" },
                create: { name: "Amazon.nl" },
              },
            },
            timeframe: "Weekly",
            endDay: new Date("2022-08-20"),
            attempt: 0,
          },
          {
            department: {
              connectOrCreate: {
                where: { name: "Amazon.nl" },
                create: { name: "Amazon.nl" },
              },
            },
            timeframe: "Monthly",
            endDay: new Date("2022-08-31"),
            attempt: 0,
          },
          {
            department: {
              connectOrCreate: {
                where: { name: "Amazon.nl" },
                create: { name: "Amazon.nl" },
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

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
type Country = {
  id: number;
  name: string;
  code:
    | "AE"
    | "AU"
    | "BR"
    | "CA"
    | "DE"
    | "ES"
    | "FR"
    | "IN"
    | "IT"
    | "JP"
    | "MX"
    | "NL"
    | "SA"
    | "SE"
    | "SG"
    | "TR"
    | "GB"
    | "US";
  url: string;
  marketplaceId: string;
  googleFolderId: string;
  dateFormat: string;
  mainDepartmentId: number;
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


const keywordsMap: { [key in Country["name"]]: typeof prisma.usKeywords } = {
  US: prisma.usKeywords,
};
const ranksMap: {
  [key in Country["name"]]: Partial<
    Record<
      Timeframe["name"],
      | typeof prisma.usDailyRanks
      | typeof prisma.usWeeklyRanks
      | typeof prisma.usMonthlyRanks
    >
  >;
} = {
  US: {
    Daily: prisma.usDailyRanks,
    Weekly: prisma.usWeeklyRanks,
    Monthly: prisma.usMonthlyRanks,
  },
};
const asinKeywordsMap: {
  [key in Country["name"]]: Partial<
    Record<
      Timeframe["name"],
      | typeof prisma.usDailyAsinKeywords
      | typeof prisma.usWeeklyAsinKeywords
      | typeof prisma.usMonthlyAsinKeywords
    >
  >;
} = {
  US: {
    Daily: prisma.usDailyAsinKeywords,
    Weekly: prisma.usWeeklyAsinKeywords,
    Monthly: prisma.usMonthlyAsinKeywords,
  },
};

class PrismaMap {
  private _keyword: any;
  private _rank: any;
  private _asinKeyword: any;
  constructor() {}

  setModels(countryCode: Country["code"], timeframe: Timeframe["name"]) {
    this._keyword = keywordsMap[countryCode];
    this._rank = ranksMap[countryCode][timeframe];
    this._asinKeyword = asinKeywordsMap[countryCode][timeframe];
  }

  get keyword() {
    return this._keyword;
  }
  get rank() {
    return this._rank;
  }
  get asinKeyword() {
    return this._asinKeyword;
  }
}

export default new PrismaMap();

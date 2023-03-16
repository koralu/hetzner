-- CreateTable
CREATE TABLE `temps` (
    `department` VARCHAR(191) NOT NULL,
    `search_term` VARCHAR(500) NOT NULL,
    `rankV` VARCHAR(191) NOT NULL,
    `asin1` VARCHAR(191) NOT NULL,
    `#1 Product Title` VARCHAR(500) NOT NULL,
    `click_share1` DOUBLE NOT NULL,
    `conversion_share1` DOUBLE NOT NULL,
    `asin2` VARCHAR(191) NOT NULL,
    `#2 Product Title` VARCHAR(500) NOT NULL,
    `click_share2` DOUBLE NOT NULL,
    `conversion_share2` DOUBLE NOT NULL,
    `asin3` VARCHAR(191) NOT NULL,
    `#3 Product Title` VARCHAR(500) NOT NULL,
    `click_share3` DOUBLE NOT NULL,
    `conversion_share3` DOUBLE NOT NULL,
    `id` INTEGER NOT NULL AUTO_INCREMENT,

    INDEX `search_term`(`search_term`),
    INDEX `asin1`(`asin1`),
    INDEX `asin2`(`asin2`),
    INDEX `asin3`(`asin3`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `ignoredAt` DATETIME(3) NULL,

    UNIQUE INDEX `departments_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `department_ranges` (
    `countryId` INTEGER NOT NULL,
    `departmentId` INTEGER NOT NULL,
    `timeframe` ENUM('Daily', 'Weekly', 'Monthly', 'Quarterly') NOT NULL,
    `startValidAt` DATE NOT NULL,
    `endValidAt` DATE NOT NULL,

    PRIMARY KEY (`countryId`, `departmentId`, `timeframe`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `countries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `code` ENUM('AE', 'AU', 'BR', 'CA', 'DE', 'ES', 'FR', 'IN', 'IT', 'JP', 'MX', 'NL', 'SA', 'SE', 'SG', 'TR', 'GB', 'US') NOT NULL,
    `dateFormat` VARCHAR(10) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `mainDepartmentId` INTEGER NOT NULL,
    `marketplaceId` VARCHAR(100) NOT NULL,
    `googleFolderId` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `countryId` INTEGER NOT NULL,
    `departmentId` INTEGER NOT NULL,
    `timeframe` ENUM('Daily', 'Weekly', 'Monthly', 'Quarterly') NOT NULL,
    `endDay` DATE NOT NULL,
    `verifiedAt` DATETIME(3) NULL,
    `downloadedAt` DATETIME(3) NULL,
    `checkedAt` DATETIME(3) NULL,
    `uploadedAt` DATETIME(3) NULL,
    `importedAt` DATETIME(3) NULL,
    `removedAt` DATETIME(3) NULL,
    `dataCheck` JSON NULL,
    `amzRows` INTEGER NULL,
    `gid` VARCHAR(191) NULL,
    `size` INTEGER NULL,
    `attempt` INTEGER NOT NULL DEFAULT 0,

    INDEX `endDayIndex`(`endDay`),
    UNIQUE INDEX `reports_countryId_departmentId_timeframe_endDay_key`(`countryId`, `departmentId`, `timeframe`, `endDay`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `US_history_asins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `asinId` INTEGER NOT NULL,
    `reviews` INTEGER NULL,
    `rating` INTEGER NULL,
    `price` INTEGER NOT NULL,
    `crawledAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `US_asins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `title` VARCHAR(191) NULL,
    `images` JSON NULL,
    `brand` VARCHAR(191) NULL,
    `bullets` JSON NULL,

    UNIQUE INDEX `US_asins_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `US_keywords` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sterm` VARCHAR(500) NOT NULL,

    UNIQUE INDEX `US_keywords_sterm_key`(`sterm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `US_daily_ranks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `keywordId` INTEGER NOT NULL,
    `rankV` INTEGER NOT NULL,
    `departmentId` INTEGER NOT NULL,
    `reportId` INTEGER NOT NULL,

    INDEX `rankDepIndex`(`departmentId`),
    INDEX `reportIndex`(`reportId`),
    UNIQUE INDEX `US_daily_ranks_keywordId_departmentId_rankV_reportId_key`(`keywordId`, `departmentId`, `rankV`, `reportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `US_daily_asin_keywords` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `asinId` INTEGER NOT NULL,
    `keywordId` INTEGER NOT NULL,
    `asinRank` INTEGER NOT NULL,
    `reportId` INTEGER NOT NULL,

    INDEX `kwIndex`(`keywordId`),
    INDEX `reportIndex`(`reportId`),
    UNIQUE INDEX `US_daily_asin_keywords_asinId_keywordId_reportId_key`(`asinId`, `keywordId`, `reportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `US_weekly_ranks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `keywordId` INTEGER NOT NULL,
    `rankV` INTEGER NOT NULL,
    `departmentId` INTEGER NOT NULL,
    `reportId` INTEGER NOT NULL,

    INDEX `rankDepIndex`(`departmentId`),
    INDEX `reportIndex`(`reportId`),
    UNIQUE INDEX `US_weekly_ranks_keywordId_departmentId_rankV_reportId_key`(`keywordId`, `departmentId`, `rankV`, `reportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `US_weekly_asin_keywords` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `asinId` INTEGER NOT NULL,
    `keywordId` INTEGER NOT NULL,
    `asinRank` INTEGER NOT NULL,
    `reportId` INTEGER NOT NULL,

    INDEX `kwIndex`(`keywordId`),
    INDEX `reportIndex`(`reportId`),
    UNIQUE INDEX `US_weekly_asin_keywords_asinId_keywordId_reportId_key`(`asinId`, `keywordId`, `reportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `US_monthly_ranks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `keywordId` INTEGER NOT NULL,
    `rankV` INTEGER NOT NULL,
    `departmentId` INTEGER NOT NULL,
    `reportId` INTEGER NOT NULL,

    INDEX `reportIndex`(`reportId`),
    INDEX `rankDepIndex`(`departmentId`),
    UNIQUE INDEX `US_monthly_ranks_keywordId_departmentId_rankV_reportId_key`(`keywordId`, `departmentId`, `rankV`, `reportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `US_monthly_asin_keywords` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `asinId` INTEGER NOT NULL,
    `keywordId` INTEGER NOT NULL,
    `asinRank` INTEGER NOT NULL,
    `reportId` INTEGER NOT NULL,

    INDEX `kwIndex`(`keywordId`),
    INDEX `reportIndex`(`reportId`),
    UNIQUE INDEX `US_monthly_asin_keywords_asinId_keywordId_reportId_key`(`asinId`, `keywordId`, `reportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `department_ranges` ADD CONSTRAINT `department_ranges_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `countries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `department_ranges` ADD CONSTRAINT `department_ranges_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `countries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `US_history_asins` ADD CONSTRAINT `US_history_asins_asinId_fkey` FOREIGN KEY (`asinId`) REFERENCES `US_asins`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `US_daily_ranks` ADD CONSTRAINT `US_daily_ranks_keywordId_fkey` FOREIGN KEY (`keywordId`) REFERENCES `US_keywords`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `US_daily_ranks` ADD CONSTRAINT `US_daily_ranks_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `US_daily_asin_keywords` ADD CONSTRAINT `US_daily_asin_keywords_keywordId_fkey` FOREIGN KEY (`keywordId`) REFERENCES `US_keywords`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `US_daily_asin_keywords` ADD CONSTRAINT `US_daily_asin_keywords_asinId_fkey` FOREIGN KEY (`asinId`) REFERENCES `US_asins`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `US_daily_asin_keywords` ADD CONSTRAINT `US_daily_asin_keywords_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `US_weekly_ranks` ADD CONSTRAINT `US_weekly_ranks_keywordId_fkey` FOREIGN KEY (`keywordId`) REFERENCES `US_keywords`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `US_weekly_ranks` ADD CONSTRAINT `US_weekly_ranks_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `US_weekly_asin_keywords` ADD CONSTRAINT `US_weekly_asin_keywords_keywordId_fkey` FOREIGN KEY (`keywordId`) REFERENCES `US_keywords`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `US_weekly_asin_keywords` ADD CONSTRAINT `US_weekly_asin_keywords_asinId_fkey` FOREIGN KEY (`asinId`) REFERENCES `US_asins`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `US_weekly_asin_keywords` ADD CONSTRAINT `US_weekly_asin_keywords_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `US_monthly_ranks` ADD CONSTRAINT `US_monthly_ranks_keywordId_fkey` FOREIGN KEY (`keywordId`) REFERENCES `US_keywords`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `US_monthly_ranks` ADD CONSTRAINT `US_monthly_ranks_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `US_monthly_asin_keywords` ADD CONSTRAINT `US_monthly_asin_keywords_keywordId_fkey` FOREIGN KEY (`keywordId`) REFERENCES `US_keywords`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `US_monthly_asin_keywords` ADD CONSTRAINT `US_monthly_asin_keywords_asinId_fkey` FOREIGN KEY (`asinId`) REFERENCES `US_asins`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `US_monthly_asin_keywords` ADD CONSTRAINT `US_monthly_asin_keywords_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `US_keywords` convert to character set utf8mb4 collate utf8mb4_0900_as_cs;
ALTER TABLE `temps` convert to character set utf8mb4 collate utf8mb4_0900_as_cs;
ALTER TABLE `US_asins` convert to character set utf8mb4 collate utf8mb4_0900_as_cs;
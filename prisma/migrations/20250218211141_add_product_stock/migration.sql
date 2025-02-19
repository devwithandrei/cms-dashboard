/*
  Warnings:

  - You are about to drop the column `customerInfoId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `colorId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `sizeId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `CustomerInfo` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `city` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerEmail` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerName` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postalCode` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Order_customerInfoId_key` ON `Order`;

-- DropIndex
DROP INDEX `Product_colorId_idx` ON `Product`;

-- DropIndex
DROP INDEX `Product_sizeId_idx` ON `Product`;

-- AlterTable
ALTER TABLE `Order` DROP COLUMN `customerInfoId`,
    ADD COLUMN `city` VARCHAR(191) NOT NULL,
    ADD COLUMN `country` VARCHAR(191) NOT NULL,
    ADD COLUMN `customerEmail` VARCHAR(191) NOT NULL,
    ADD COLUMN `customerName` VARCHAR(191) NOT NULL,
    ADD COLUMN `postalCode` VARCHAR(191) NOT NULL,
    ADD COLUMN `shippingMethod` VARCHAR(191) NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    ADD COLUMN `trackingNumber` VARCHAR(191) NULL,
    ALTER COLUMN `phone` DROP DEFAULT,
    ALTER COLUMN `address` DROP DEFAULT;

-- AlterTable
ALTER TABLE `OrderItem` ADD COLUMN `colorId` VARCHAR(191) NULL,
    ADD COLUMN `price` DECIMAL(65, 30) NOT NULL,
    ADD COLUMN `quantity` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `sizeId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Product` DROP COLUMN `colorId`,
    DROP COLUMN `sizeId`,
    ADD COLUMN `stock` INTEGER NULL;

-- DropTable
DROP TABLE `CustomerInfo`;

-- CreateTable
CREATE TABLE `ProductSize` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `sizeId` VARCHAR(191) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProductSize_productId_idx`(`productId`),
    INDEX `ProductSize_sizeId_idx`(`sizeId`),
    UNIQUE INDEX `ProductSize_productId_sizeId_key`(`productId`, `sizeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductColor` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `colorId` VARCHAR(191) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProductColor_productId_idx`(`productId`),
    INDEX `ProductColor_colorId_idx`(`colorId`),
    UNIQUE INDEX `ProductColor_productId_colorId_key`(`productId`, `colorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockHistory` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `oldStock` INTEGER NOT NULL,
    `newStock` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `changeType` VARCHAR(191) NOT NULL,
    `sizeId` VARCHAR(191) NULL,
    `colorId` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StockHistory_productId_idx`(`productId`),
    INDEX `StockHistory_sizeId_idx`(`sizeId`),
    INDEX `StockHistory_colorId_idx`(`colorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `OrderItem_sizeId_idx` ON `OrderItem`(`sizeId`);

-- CreateIndex
CREATE INDEX `OrderItem_colorId_idx` ON `OrderItem`(`colorId`);

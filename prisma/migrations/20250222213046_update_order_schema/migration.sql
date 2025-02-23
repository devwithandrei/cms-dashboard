/*
  Warnings:

  - You are about to drop the column `value` on the `Brand` table. All the data in the column will be lost.
  - The values [CANCELED] on the enum `Order_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `changeType` on the `StockHistory` table. All the data in the column will be lost.
  - You are about to drop the column `colorId` on the `StockHistory` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `StockHistory` table. All the data in the column will be lost.
  - You are about to drop the column `newStock` on the `StockHistory` table. All the data in the column will be lost.
  - You are about to drop the column `oldStock` on the `StockHistory` table. All the data in the column will be lost.
  - You are about to drop the column `sizeId` on the `StockHistory` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `StockHistory` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `StockHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `StockHistory` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `StockHistory_colorId_idx` ON `StockHistory`;

-- DropIndex
DROP INDEX `StockHistory_sizeId_idx` ON `StockHistory`;

-- AlterTable
ALTER TABLE `Brand` DROP COLUMN `value`;

-- AlterTable
ALTER TABLE `Description` MODIFY `name` TEXT NOT NULL,
    MODIFY `value` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `isPaid` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `paymentIntentId` VARCHAR(191) NULL,
    ADD COLUMN `shippingMethod` VARCHAR(191) NULL,
    ADD COLUMN `trackingNumber` VARCHAR(191) NULL,
    ADD COLUMN `userId` VARCHAR(191) NOT NULL,
    MODIFY `amount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    MODIFY `status` ENUM('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `StockHistory` DROP COLUMN `changeType`,
    DROP COLUMN `colorId`,
    DROP COLUMN `createdBy`,
    DROP COLUMN `newStock`,
    DROP COLUMN `oldStock`,
    DROP COLUMN `sizeId`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `quantity` INTEGER NOT NULL,
    ADD COLUMN `type` VARCHAR(191) NOT NULL,
    MODIFY `reason` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_UserToWishlist` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_UserToWishlist_AB_unique`(`A`, `B`),
    INDEX `_UserToWishlist_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Order_userId_idx` ON `Order`(`userId`);

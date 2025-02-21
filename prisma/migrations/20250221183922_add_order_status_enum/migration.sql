/*
  Warnings:

  - You are about to drop the column `customerDetails` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `paymentIntentId` on the `Order` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Order_status_idx` ON `Order`;

-- AlterTable
ALTER TABLE `Order` DROP COLUMN `customerDetails`,
    DROP COLUMN `paymentIntentId`,
    ADD COLUMN `address` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `city` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `country` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `customerEmail` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `customerName` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `phone` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `postalCode` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY `amount` DOUBLE NOT NULL DEFAULT 0;

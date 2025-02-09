/*
  Warnings:

  - You are about to drop the column `customerInfoId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the `CustomerInfo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX `Order_customerInfoId_key` ON `Order`;

-- AlterTable
ALTER TABLE `Order` DROP COLUMN `customerInfoId`;

-- DropTable
DROP TABLE `CustomerInfo`;

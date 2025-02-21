/*
  Warnings:

  - You are about to drop the column `status` on the `Order` table. All the data in the column will be lost.
  - Made the column `paymentStatus` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX `Order_status_idx` ON `Order`;

-- AlterTable
ALTER TABLE `Order` DROP COLUMN `status`,
    MODIFY `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX `Order_paymentStatus_idx` ON `Order`(`paymentStatus`);

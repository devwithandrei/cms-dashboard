/*
  Warnings:

  - You are about to drop the column `paymentStatus` on the `Order` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Order_paymentStatus_idx` ON `Order`;

-- AlterTable
ALTER TABLE `Order` DROP COLUMN `paymentStatus`,
    ADD COLUMN `status` ENUM('PENDING', 'PAID', 'DELIVERED', 'CANCELED') NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX `Order_status_idx` ON `Order`(`status`);

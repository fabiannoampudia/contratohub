/*
  Warnings:

  - You are about to drop the column `mapping` on the `Contract` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Contract" DROP COLUMN "mapping",
ADD COLUMN     "area" TEXT,
ADD COLUMN     "fileUrl" TEXT;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "area" TEXT,
ADD COLUMN     "responsible" TEXT;

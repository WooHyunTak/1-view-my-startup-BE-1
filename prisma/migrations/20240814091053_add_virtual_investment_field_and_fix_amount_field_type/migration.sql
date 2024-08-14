-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "vitualInvestment" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Investment" ALTER COLUMN "amount" SET DATA TYPE BIGINT;

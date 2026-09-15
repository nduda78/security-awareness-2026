-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "photo" BYTEA,
ADD COLUMN     "photoMimeType" TEXT,
ADD COLUMN     "photoUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "platformOwnerId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "refresh_tokens_platformOwnerId_idx" ON "refresh_tokens"("platformOwnerId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_platformOwnerId_fkey" FOREIGN KEY ("platformOwnerId") REFERENCES "platform_owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

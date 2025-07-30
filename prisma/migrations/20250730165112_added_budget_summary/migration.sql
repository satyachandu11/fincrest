-- CreateTable
CREATE TABLE "budget_summaries" (
    "id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "budget_summaries_userId_idx" ON "budget_summaries"("userId");

-- AddForeignKey
ALTER TABLE "budget_summaries" ADD CONSTRAINT "budget_summaries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

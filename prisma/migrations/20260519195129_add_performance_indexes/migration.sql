-- CreateIndex
CREATE INDEX "Insight_restaurantId_idx" ON "Insight"("restaurantId");

-- CreateIndex
CREATE INDEX "Restaurant_userId_idx" ON "Restaurant"("userId");

-- CreateIndex
CREATE INDEX "Review_restaurantId_reviewDate_idx" ON "Review"("restaurantId", "reviewDate" DESC);

-- CreateIndex
CREATE INDEX "VoiceSample_restaurantId_idx" ON "VoiceSample"("restaurantId");

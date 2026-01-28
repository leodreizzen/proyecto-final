-- CreateIndex
CREATE INDEX "Resolution_date_year_number_initial_idx" ON "Resolution"("date" DESC, "year" DESC, "number" DESC, "initial" ASC);

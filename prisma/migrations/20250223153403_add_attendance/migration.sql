-- CreateTable
CREATE TABLE "OpeningDay" (
    "id" SERIAL NOT NULL,
    "openTimeUTC" TIMESTAMP(3) NOT NULL,
    "closeTimeUTC" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpeningDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "openingDayId" INTEGER NOT NULL,
    "checkInUTC" TIMESTAMP(3) NOT NULL,
    "checkOutUTC" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpeningDay_openTimeUTC_key" ON "OpeningDay"("openTimeUTC");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_memberId_openingDayId_key" ON "Attendance"("memberId", "openingDayId");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_openingDayId_fkey" FOREIGN KEY ("openingDayId") REFERENCES "OpeningDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

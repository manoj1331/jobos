-- CreateTable
CREATE TABLE "discovered_jobs" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "companyLogo" TEXT,
    "companyWebsite" TEXT,
    "companyLinkedin" TEXT,
    "companyCareersUrl" TEXT,
    "companySize" TEXT,
    "companyFunding" TEXT,
    "companyDescription" TEXT,
    "companyType" TEXT,
    "hrEmails" TEXT[],
    "location" TEXT,
    "isRemote" BOOLEAN NOT NULL DEFAULT false,
    "isHybrid" BOOLEAN NOT NULL DEFAULT false,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryCurrency" TEXT,
    "description" TEXT,
    "skills" TEXT[],
    "applyUrl" TEXT NOT NULL,
    "jobType" TEXT,
    "experienceMin" INTEGER,
    "experienceMax" INTEGER,
    "postedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovered_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_saved_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discoveredJobId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_saved_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_job_applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discoveredJobId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interviewAt" TIMESTAMP(3),
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discovered_jobs_source_idx" ON "discovered_jobs"("source");

-- CreateIndex
CREATE INDEX "discovered_jobs_isActive_idx" ON "discovered_jobs"("isActive");

-- CreateIndex
CREATE INDEX "discovered_jobs_title_idx" ON "discovered_jobs"("title");

-- CreateIndex
CREATE INDEX "discovered_jobs_company_idx" ON "discovered_jobs"("company");

-- CreateIndex
CREATE UNIQUE INDEX "discovered_jobs_externalId_source_key" ON "discovered_jobs"("externalId", "source");

-- CreateIndex
CREATE UNIQUE INDEX "user_saved_jobs_userId_discoveredJobId_key" ON "user_saved_jobs"("userId", "discoveredJobId");

-- CreateIndex
CREATE UNIQUE INDEX "user_job_applications_userId_discoveredJobId_key" ON "user_job_applications"("userId", "discoveredJobId");

-- AddForeignKey
ALTER TABLE "user_saved_jobs" ADD CONSTRAINT "user_saved_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_saved_jobs" ADD CONSTRAINT "user_saved_jobs_discoveredJobId_fkey" FOREIGN KEY ("discoveredJobId") REFERENCES "discovered_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_job_applications" ADD CONSTRAINT "user_job_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_job_applications" ADD CONSTRAINT "user_job_applications_discoveredJobId_fkey" FOREIGN KEY ("discoveredJobId") REFERENCES "discovered_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

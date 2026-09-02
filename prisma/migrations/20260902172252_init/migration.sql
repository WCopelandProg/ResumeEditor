-- CreateEnum
CREATE TYPE "SuggestionCategory" AS ENUM ('GRAMMAR', 'CLARITY', 'IMPACT', 'QUANTIFICATION', 'ACTION_VERB', 'FORMATTING', 'STRUCTURE', 'ATS', 'SKILLS', 'REDUNDANCY', 'RELEVANCE', 'TONE');

-- CreateEnum
CREATE TYPE "SuggestionSeverity" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EDITED');

-- CreateEnum
CREATE TYPE "ParseStatus" AS ENUM ('PENDING', 'SUCCESS', 'NO_TEXT_LAYER', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetRole" TEXT,
    "templateId" TEXT NOT NULL DEFAULT 'modern',
    "content" JSONB NOT NULL,
    "sourceFileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_styles" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL DEFAULT 'modern',
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "fontSizePt" INTEGER NOT NULL DEFAULT 10,
    "headingScale" DOUBLE PRECISION NOT NULL DEFAULT 1.15,
    "lineSpacing" DOUBLE PRECISION NOT NULL DEFAULT 1.15,
    "marginTopIn" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "marginRightIn" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "marginBottomIn" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "marginLeftIn" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "bulletSpacingPt" INTEGER NOT NULL DEFAULT 2,
    "sectionSpacingPt" INTEGER NOT NULL DEFAULT 10,
    "alignment" TEXT NOT NULL DEFAULT 'left',
    "accentColor" TEXT NOT NULL DEFAULT '#1d4ed8',
    "showDividers" BOOLEAN NOT NULL DEFAULT true,
    "columns" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_versions" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isAutosave" BOOLEAN NOT NULL DEFAULT false,
    "content" JSONB NOT NULL,
    "style" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestions" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "category" "SuggestionCategory" NOT NULL,
    "severity" "SuggestionSeverity" NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "sectionId" TEXT,
    "entryId" TEXT,
    "bulletId" TEXT,
    "originalText" TEXT,
    "suggestedText" TEXT,
    "finalText" TEXT,
    "explanation" TEXT NOT NULL,
    "question" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_descriptions" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "title" TEXT,
    "company" TEXT,
    "rawText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_descriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_results" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "jobDescriptionId" TEXT,
    "overallScore" INTEGER NOT NULL,
    "categoryScores" JSONB NOT NULL,
    "atsScore" INTEGER NOT NULL,
    "atsIssues" JSONB NOT NULL,
    "healthChecklist" JSONB NOT NULL,
    "jobMatchScore" INTEGER,
    "missingKeywords" JSONB,
    "matchExplanation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploaded_files" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT,
    "originalFilename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "parseStatus" "ParseStatus" NOT NULL DEFAULT 'PENDING',
    "extractedText" TEXT,
    "parseError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "resumes_sourceFileId_key" ON "resumes"("sourceFileId");

-- CreateIndex
CREATE INDEX "resumes_userId_idx" ON "resumes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "resume_styles_resumeId_key" ON "resume_styles"("resumeId");

-- CreateIndex
CREATE INDEX "resume_versions_resumeId_createdAt_idx" ON "resume_versions"("resumeId", "createdAt");

-- CreateIndex
CREATE INDEX "suggestions_resumeId_status_idx" ON "suggestions"("resumeId", "status");

-- CreateIndex
CREATE INDEX "job_descriptions_resumeId_idx" ON "job_descriptions"("resumeId");

-- CreateIndex
CREATE INDEX "analysis_results_resumeId_createdAt_idx" ON "analysis_results"("resumeId", "createdAt");

-- CreateIndex
CREATE INDEX "uploaded_files_userId_idx" ON "uploaded_files"("userId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "uploaded_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_styles" ADD CONSTRAINT "resume_styles_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_descriptions" ADD CONSTRAINT "job_descriptions_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_jobDescriptionId_fkey" FOREIGN KEY ("jobDescriptionId") REFERENCES "job_descriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

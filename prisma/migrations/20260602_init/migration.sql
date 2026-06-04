-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ENGINEER');
CREATE TYPE "TicketStatus" AS ENUM ('NOT_YET_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'DONE', 'DONE_BY_L2', 'ESCALATED_TO_L2');
CREATE TYPE "Urgency" AS ENUM ('NOT_SPECIFIED', 'LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "Category" AS ENUM ('CATEGORY_1', 'CATEGORY_2', 'CATEGORY_3');
CREATE TYPE "IssueType" AS ENUM ('MARLIN_ISSUE', 'COMSOF_ISSUE');
CREATE TYPE "CanUserSolve" AS ENUM ('YES', 'NO', 'UNKNOWN', 'PARTIALLY');
CREATE TYPE "DocumentationStatus" AS ENUM ('ALREADY_EXISTS', 'NOT_NEEDED', 'WILL_CREATE', 'CREATED', 'UNKNOWN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ENGINEER',
    "engineerPrefix" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_engineerPrefix_key" ON "User"("engineerPrefix");

-- CreateTable
CREATE TABLE "Solution" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Solution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "estimatedEnd" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "category" "Category" NOT NULL,
    "issueType" "IssueType" NOT NULL,
    "urgency" "Urgency" NOT NULL DEFAULT 'NOT_SPECIFIED',
    "status" "TicketStatus" NOT NULL DEFAULT 'NOT_YET_STARTED',
    "popZone" TEXT NOT NULL,
    "designPartner" TEXT NOT NULL,
    "subcontractor" TEXT NOT NULL,
    "summary" TEXT,
    "canUserSolve" "CanUserSolve" NOT NULL DEFAULT 'NO',
    "documentationStatus" "DocumentationStatus" NOT NULL DEFAULT 'UNKNOWN',
    "solutionId" TEXT,
    "remarks" TEXT,
    "isValidTicket" BOOLEAN NOT NULL DEFAULT true,
    "isOutlier" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "isEscalated" BOOLEAN NOT NULL DEFAULT false,
    "resolutionDays" DOUBLE PRECISION,
    "city" TEXT,
    "primaryPop" TEXT,
    "popCount" INTEGER NOT NULL DEFAULT 1,
    "issueTopic" TEXT,
    "solutionTopic" TEXT,
    "legacySummary" TEXT,
    "legacySolution" TEXT,
    "engineerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documentation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "section" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Documentation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Solution" ADD CONSTRAINT "Solution_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

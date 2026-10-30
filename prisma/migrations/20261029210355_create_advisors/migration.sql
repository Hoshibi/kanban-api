-- CreateEnum
CREATE TYPE "AdvisorRole" AS ENUM ('advisor', 'senior_partner', 'admin');

-- CreateTable
CREATE TABLE "advisors" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "avatar_url" VARCHAR(255),
    "role" "AdvisorRole" NOT NULL DEFAULT 'advisor',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advisors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "advisors_email_key" ON "advisors"("email");

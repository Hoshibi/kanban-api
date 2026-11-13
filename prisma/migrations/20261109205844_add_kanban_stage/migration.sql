-- CreateTable
CREATE TABLE "kanban_stages" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "color_border" VARCHAR(50),
    "color_accent" VARCHAR(50),
    "badge_bg" VARCHAR(100),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kanban_stages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kanban_stages_slug_key" ON "kanban_stages"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "kanban_stages_position_key" ON "kanban_stages"("position");

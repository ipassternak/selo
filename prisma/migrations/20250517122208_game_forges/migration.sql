-- CreateTable
CREATE TABLE "game_forges" (
    "id" VARCHAR(36) NOT NULL,
    "version_id" VARCHAR(32) NOT NULL,
    "game_version_id" VARCHAR(36) NOT NULL,
    "package_url" VARCHAR(255) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_forges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_forge_tags" (
    "game_forge_id" VARCHAR(36) NOT NULL,
    "tag_id" VARCHAR(36) NOT NULL,

    CONSTRAINT "game_forge_tags_pkey" PRIMARY KEY ("game_forge_id","tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_forges_version_id_key" ON "game_forges"("version_id");

-- CreateIndex
CREATE INDEX "game_forge_game_version_id_idx" ON "game_forges"("game_version_id");

-- AddForeignKey
ALTER TABLE "game_forges" ADD CONSTRAINT "game_forges_game_version_id_fkey" FOREIGN KEY ("game_version_id") REFERENCES "game_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_forge_tags" ADD CONSTRAINT "game_forge_tags_game_forge_id_fkey" FOREIGN KEY ("game_forge_id") REFERENCES "game_forges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_forge_tags" ADD CONSTRAINT "game_forge_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

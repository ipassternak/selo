-- CreateTable
CREATE TABLE "game_versions" (
    "id" VARCHAR(36) NOT NULL,
    "version_id" VARCHAR(32) NOT NULL,
    "version_type" VARCHAR(32) NOT NULL,
    "package_url" VARCHAR(255) NOT NULL,
    "released_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(32) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_version_tags" (
    "game_version_id" VARCHAR(36) NOT NULL,
    "tag_id" VARCHAR(36) NOT NULL,

    CONSTRAINT "game_version_tags_pkey" PRIMARY KEY ("game_version_id","tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_versions_version_id_key" ON "game_versions"("version_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- AddForeignKey
ALTER TABLE "game_version_tags" ADD CONSTRAINT "game_version_tags_game_version_id_fkey" FOREIGN KEY ("game_version_id") REFERENCES "game_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_version_tags" ADD CONSTRAINT "game_version_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

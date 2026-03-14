-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ModelVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "color" TEXT,
    "size" TEXT,
    "costPrice" INTEGER,
    "salePrice" INTEGER,
    "quantity" INTEGER NOT NULL,
    "modelId" TEXT NOT NULL,
    CONSTRAINT "ModelVariant_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ModelVariant" ("color", "costPrice", "id", "modelId", "quantity", "salePrice", "size") SELECT "color", "costPrice", "id", "modelId", "quantity", "salePrice", "size" FROM "ModelVariant";
DROP TABLE "ModelVariant";
ALTER TABLE "new_ModelVariant" RENAME TO "ModelVariant";
CREATE UNIQUE INDEX "ModelVariant_modelId_color_size_key" ON "ModelVariant"("modelId", "color", "size");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

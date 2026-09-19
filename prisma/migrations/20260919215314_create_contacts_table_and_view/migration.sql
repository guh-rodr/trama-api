-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('CUSTOMER', 'SUPPLIER');

-- DropForeignKey
ALTER TABLE "Payment"
DROP CONSTRAINT "Payment_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Receivable"
DROP CONSTRAINT "Receivable_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Sale"
DROP CONSTRAINT "Sale_customerId_fkey";

-- CreateTable
CREATE TABLE
    "Contact" (
        "id" TEXT NOT NULL,
        "type" "ContactType" NOT NULL,
        "name" TEXT NOT NULL,
        "document" TEXT,
        "phone" TEXT,
        "note" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" TIMESTAMP(3),
        CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
    );

-- CreateIndex
CREATE UNIQUE INDEX "Contact_document_key" ON "Contact" ("document");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- View
CREATE VIEW
    "ContactStats" AS
SELECT
    c.id,
    c.name,
    c.type,
    c.note,
    c.phone,
    c."deletedAt",
    CASE
        WHEN EXISTS (
            SELECT
                1
            FROM
                "Sale" s
            WHERE
                s."customerId" = c.id
        )
        OR EXISTS (
            SELECT
                1
            FROM
                "Receivable" r
            WHERE
                r."customerId" = c.id
        ) THEN true
        ELSE false
    END AS "hasFinancialLog"
FROM
    "Contact" c
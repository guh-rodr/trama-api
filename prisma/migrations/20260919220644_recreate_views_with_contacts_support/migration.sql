-- VENDA
CREATE VIEW
  "SaleStats" AS
SELECT
  s.id,
  s.total,
  s.profit,
  COALESCE(item_agg.count, 0) AS "itemCount",
  s."purchasedAt",
  s."createdAt",
  CASE
    WHEN COALESCE(receivable_agg.paid, 0) = 0 THEN 'PENDING'
    WHEN receivable_agg.paid >= s.total THEN 'PAID'
    ELSE 'PARTIAL'
  END AS status,
  c.id AS "customerId",
  c.name AS "customerName"
FROM
  "Sale" s
  LEFT JOIN "Contact" c ON c.id = s."customerId"
  LEFT JOIN (
    SELECT
      "saleId",
      SUM(paid) AS paid
    FROM
      "Receivable"
    WHERE
      "saleId" IS NOT NULL
    GROUP BY
      "saleId"
  ) receivable_agg ON receivable_agg."saleId" = s.id
  LEFT JOIN (
    SELECT
      "saleId",
      COUNT(*) AS count
    FROM
      "SaleItem"
    WHERE
      "saleId" IS NOT NULL
    GROUP BY
      "saleId"
  ) item_agg ON item_agg."saleId" = s.id;

-- RECEBIVEL
CREATE VIEW
  "ReceivableStats" AS
SELECT
  c.id as "customerId",
  c.name as "customerName",
  r.id,
  r.total,
  r.paid,
  r."saleId",
  r.description,
  EXISTS (
    SELECT
      1
    FROM
      "PaymentAllocation" pa
    WHERE
      pa."receivableId" = r.id
  ) AS "hasFinancialLog",
  r.status,
  r."occurredAt",
  r."dueAt"
FROM
  "Receivable" r
  LEFT JOIN "Contact" c ON c.id = r."customerId"
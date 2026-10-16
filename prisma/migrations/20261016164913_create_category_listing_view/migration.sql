CREATE VIEW "CategoryStats" AS
  SELECT
  c.id,
  c.name,
  COUNT(p.id) AS "productCount"
  FROM "Category" c
  LEFT JOIN "Product" p ON p."categoryId" = c.id
  GROUP BY c.id
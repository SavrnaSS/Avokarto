-- One review per customer per product - lets a real submission "upsert"
-- (edit their existing review) instead of silently piling up duplicates
-- every time My Reviews re-submits for the same product. NULL customer_id
-- (reviews not tied to a real account) are unaffected - Postgres treats
-- NULLs as distinct for uniqueness purposes.
ALTER TABLE product_reviews
ADD CONSTRAINT product_reviews_product_customer_unique UNIQUE (product_id, customer_id);

-- The product count the /sell homepage advertises ("500+ winning products
-- ready to sell"), set in admin > Resellers > Marketplace rules. NULL shows
-- the live count of published products instead.

ALTER TABLE reseller_settings
	ADD COLUMN IF NOT EXISTS advertised_products integer
		CHECK (advertised_products IS NULL OR (advertised_products >= 1 AND advertised_products <= 10000000));

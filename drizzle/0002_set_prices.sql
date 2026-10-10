-- Precios definitivos del cliente (retail y mayorista) para los 18 productos.
-- Solo toca los productos que vienen con el sitio (por su slug); los que se
-- hayan creado a mano en el panel no cambian.
UPDATE `products` SET `priceCents` = 3499, `wholesalePriceCents` = 1750 WHERE `slug` LIKE 'cbg-flower-%';--> statement-breakpoint
UPDATE `products` SET `priceCents` = 1999, `wholesalePriceCents` = 999 WHERE `slug` LIKE 'pre-rolls-%';--> statement-breakpoint
UPDATE `products` SET `priceCents` = 3999, `wholesalePriceCents` = 1750 WHERE `slug` LIKE 'disposable-%';

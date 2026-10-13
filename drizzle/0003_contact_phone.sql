-- Teléfono de contacto del cliente. Se escribe en site_settings porque un valor
-- guardado desde el panel (aunque esté vacío) tiene prioridad sobre el de código.
INSERT INTO `site_settings` (`key`, `value`) VALUES ('phone', '818.740.8234') ON DUPLICATE KEY UPDATE `value` = '818.740.8234';

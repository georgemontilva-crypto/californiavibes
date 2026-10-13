-- Único correo de contacto que muestra el sitio (pie de página y Contact Us).
INSERT INTO `site_settings` (`key`, `value`) VALUES ('email', 'sales@mycaliforniavibes.com') ON DUPLICATE KEY UPDATE `value` = 'sales@mycaliforniavibes.com';

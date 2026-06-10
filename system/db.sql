-- Datenbankschema für die Snoozy-Anwendung und ihre Messdaten.
-- Hier wird die Tabelle für Benutzerkonten angelegt, damit Login und Registrierung funktionieren.
-- db.sql
-- Create the database and the users table

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY (`email`)
);

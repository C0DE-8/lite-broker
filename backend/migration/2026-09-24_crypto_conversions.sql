-- Cash/crypto wallet conversion ledger.
-- Execute this file against the production database before enabling conversion routes.

CREATE TABLE IF NOT EXISTS crypto_conversions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  direction ENUM('buy','sell') NOT NULL,
  asset VARCHAR(16) NOT NULL,
  source_amount DECIMAL(28,8) NOT NULL,
  received_amount DECIMAL(28,8) NOT NULL,
  price_usd DECIMAL(28,8) NOT NULL,
  price_source VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY crypto_conversions_user_idx (user_id,id),
  CONSTRAINT crypto_conversions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

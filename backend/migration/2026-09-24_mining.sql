-- Mining equipment, miner runtime, earnings ledger, and battery purchases.
-- Apply from backend: npm install && npm run migrate (or execute this file with mysql/mariadb CLI).

SET @mining_balance_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'mining_balance'
);
SET @mining_balance_ddl = IF(
  @mining_balance_exists = 0,
  'ALTER TABLE users ADD COLUMN mining_balance DECIMAL(24,2) NOT NULL DEFAULT 0.00',
  'SELECT 1'
);
PREPARE mining_balance_stmt FROM @mining_balance_ddl;
EXECUTE mining_balance_stmt;
DEALLOCATE PREPARE mining_balance_stmt;

CREATE TABLE IF NOT EXISTS mining_levels (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500) NULL,
  power_watts INT UNSIGNED NOT NULL,
  price DECIMAL(24,2) NOT NULL,
  hourly_earning DECIMAL(24,4) NOT NULL,
  battery_hours INT UNSIGNED NOT NULL,
  battery_price DECIMAL(24,2) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY mining_levels_name_uq (name), KEY mining_levels_active_idx (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS user_miners (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  level_id INT UNSIGNED NOT NULL,
  status ENUM('stopped','running','depleted') NOT NULL DEFAULT 'stopped',
  battery_seconds_remaining INT UNSIGNED NOT NULL DEFAULT 0,
  last_accrued_at DATETIME NULL,
  started_at DATETIME NULL,
  stopped_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY user_miners_user_idx (user_id,id), KEY user_miners_status_idx (status,last_accrued_at),
  CONSTRAINT user_miners_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT user_miners_level_fk FOREIGN KEY (level_id) REFERENCES mining_levels(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS mining_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  miner_id BIGINT UNSIGNED NULL,
  type ENUM('equipment_purchase','battery_purchase','earning','transfer') NOT NULL,
  amount DECIMAL(24,4) NOT NULL,
  mining_balance_after DECIMAL(24,2) NOT NULL,
  account_balance_key ENUM('main_balance','profit_balance','investment_balance') NULL,
  note VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY mining_transactions_user_idx (user_id,id), KEY mining_transactions_miner_idx (miner_id,id),
  CONSTRAINT mining_transactions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT mining_transactions_miner_fk FOREIGN KEY (miner_id) REFERENCES user_miners(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO mining_levels (name, description, power_watts, price, hourly_earning, battery_hours, battery_price, sort_order)
VALUES
  ('Starter Miner', 'Entry equipment for learning the mining workspace.', 100, 25.00, 0.0100, 12, 2.00, 1),
  ('Growth Miner', 'Mid-tier equipment with higher wattage and hourly accrual.', 500, 100.00, 0.0500, 24, 8.00, 2),
  ('Pro Miner', 'High-power equipment with the highest hourly accrual.', 1000, 250.00, 0.1000, 48, 20.00, 3)
ON DUPLICATE KEY UPDATE name=VALUES(name);

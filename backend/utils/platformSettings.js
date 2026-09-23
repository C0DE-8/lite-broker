const defaults = {
  fee: "0.00",
  message: "Contact your account manager to receive your withdrawal PIN.",
};

async function ensurePlatformSettings(db) {
  await db.query(`CREATE TABLE IF NOT EXISTS platform_settings (
    setting_key VARCHAR(100) NOT NULL PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_by INT UNSIGNED NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query(
    "INSERT IGNORE INTO platform_settings (setting_key,setting_value) VALUES ('withdrawal_pin_fee',?),('withdrawal_pin_message',?)",
    [defaults.fee, defaults.message],
  );
}

async function getWithdrawalPinSettings(db) {
  await ensurePlatformSettings(db);
  const [rows] = await db.query(
    "SELECT setting_key,setting_value FROM platform_settings WHERE setting_key IN ('withdrawal_pin_fee','withdrawal_pin_message')",
  );
  const settings = Object.fromEntries(
    rows.map((row) => [row.setting_key, row.setting_value]),
  );
  return {
    fee: settings.withdrawal_pin_fee || defaults.fee,
    message: settings.withdrawal_pin_message ?? defaults.message,
  };
}

module.exports = { ensurePlatformSettings, getWithdrawalPinSettings };

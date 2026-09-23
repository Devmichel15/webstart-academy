const TECHNICAL_DB_PATTERNS = [
  /violates foreign key constraint/i,
  /violates unique constraint/i,
  /violates not-null constraint/i,
  /duplicate key value/i,
  /insert or update on table/i,
  /null value in column/i,
  /relation .* does not exist/i,
  /column .* does not exist/i,
  /syntax error/i,
  /permission denied for table/i,
  /PGRST\d+/,
  /Database error/i,
];

function isTechnicalDbError(err) {
  if (!err || typeof err !== "object") return false;
  if (err?.code && typeof err.code === "string" && /^\d{5}$/.test(err.code)) {
    return true;
  }
  if (err?.details || err?.hint) return true;
  const message = String(err?.message || "");
  return TECHNICAL_DB_PATTERNS.some((re) => re.test(message));
}

export function toUserMessage(err, fallback) {
  if (isTechnicalDbError(err)) {
    console.error("[erro técnico (não exibido ao utilizador)]", err);
    return fallback;
  }
  return err?.message || fallback;
}
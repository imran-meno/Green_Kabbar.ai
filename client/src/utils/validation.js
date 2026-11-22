export function isValidPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export function isSukkurLocation(location) {
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng)
    && lat >= 27.5 && lat <= 27.9
    && lng >= 68.65 && lng <= 69.05;
}

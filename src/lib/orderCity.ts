export const getOrderCity = (address: string | null | undefined) => {
  const raw = (address ?? "").trim();
  if (!raw) return "";

  const parts = raw.split(",");
  if (parts.length === 1) return parts[0].trim();

  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const segment = parts[index].trim();
    if (segment) return segment;
  }

  return raw;
};

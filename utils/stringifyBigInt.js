export const replaceBigIntToString = (key, value) =>
  typeof value === "bigint" ? value.toString() : value;

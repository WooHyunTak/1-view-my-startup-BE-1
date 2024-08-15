export function stringifyBigInt(data) {
  return JSON.stringify(data, (key, value) => {
    return typeof value === "bigint" ? value.toString() : value;
  });
}

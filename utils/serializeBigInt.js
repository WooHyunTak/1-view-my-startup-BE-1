//빅인트 처리를 위한 로직 빅인트타입을 스트링으로 변환한다.
export const serializeBigInt = (value) => {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "object") {
    Object.keys(value).forEach((key) => {
      value[key] = serializeBigInt(value[key]);
    });
  }
  return value;
};

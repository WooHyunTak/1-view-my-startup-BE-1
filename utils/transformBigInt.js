function transformBigInt(obj) {
  // 입력된 값이 객체이거나 배열인지 확인
  // null은 객체로 취급되기 때문에 추가적으로 null 체크
  if (typeof obj === "object" && obj !== null) {
    // 객체 또는 배열의 모든 키 순회
    for (const key in obj) {
      // 해당 키의 값이 BigInt 타입인지 확인
      if (typeof obj[key] === "bigint") {
        // 문자열로 변환
        obj[key] = obj[key].toString();
      }
      // 값이 또 다른 객체이거나 배열인 경우, 재귀적으로 함수를 호출
      else if (typeof obj[key] === "object") {
        transformBigInt(obj[key]);
      }
    }
  }
  // 변환된 객체를 반환
  return obj;
}

export default transformBigInt;

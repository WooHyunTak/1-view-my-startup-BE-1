import * as s from "superstruct";
import isUuid from "is-uuid";

export const Uuid = s.define("Uuid", (value) => isUuid.v4(value));

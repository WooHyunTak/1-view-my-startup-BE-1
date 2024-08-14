import * as s from "superstruct";
import isUuid from "is-uuid";

const uuid = s.define("Uuid", (value) => isUuid.v4(value));

export const createInvestment = s.object({
  name: s.size(s.string(), 1, 50),
  amount: s.integer(),
  comment: s.string(),
  password: s.string(),
  companyId: uuid,
});

export const patchInvestment = s.partial(createInvestment);

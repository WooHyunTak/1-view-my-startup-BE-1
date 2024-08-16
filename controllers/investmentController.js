import { PrismaClient } from "@prisma/client";
import transformBigInt from "../utils/transformBigInt";

const prisma = new PrismaClient();

// 가장 투자 생성
export const createInvestment = async (req, res) => {
  const { companyId, name, amount, comment, password } = req;
};

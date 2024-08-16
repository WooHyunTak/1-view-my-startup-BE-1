import { PrismaClient } from "@prisma/client";
import transformBigInt from "../utils/transformBigInt.js";

const prisma = new PrismaClient();

// 가상 투자자 생성
export const createInvestment = async (req, res) => {
  // 클라이언트로부터 입력받은 투자 정보
  const { name, amount, comment, password, companyId } = req.body;

  await prisma.$transaction(async (prisma) => {
    const investment = await prisma.investment.create({
      data: {
        name,
        amount,
        comment,
        password,
        company: {
          // 회사와 관계 설정
          connect: { id: companyId },
        },
      },
    });

    // 해당 기업의 virtualInvestment 금액 업데이트
    await prisma.company.update({
      where: { id: companyId },
      data: {
        virtualInvestment: {
          // 현재 금액에 amount를 더함
          increment: amount,
        },
      },
    });

    // bigInt 변환 후 201 응답
    res.status(201).send(transformBigInt(investment));
  });
};

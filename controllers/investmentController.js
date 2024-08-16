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

// 가장 투자 수정
export const updateInvestment = async (req, res) => {
  // 수정하려는 투자 ID
  const { id } = req.params;
  // 수정하려는 정보 및 비밀번호
  const { amount, comment, password } = req.body;

  // ID와 일치하는 투자가져오기
  const investment = await prisma.investment.findUniqueOrThrow({
    where: { id },
  });

  // 찾으려는 투자자가 없거나 비밀번호가 일치하지 않는 경우
  if (!investment || investment.password !== password) {
    return res.status(403).send({ message: "Incorrect password or investment not found." });
  }

  await prisma.$transaction(async (prisma) => {
    // 기존 amount와 새로운 amount 차이 계산
    const amountDiff = BigInt(amount) - investment.amount;

    // 가상 투자 업데이트
    const updatedInvestment = await prisma.investment.update({
      where: { id },
      // 투자 금액과 코멘트 업데이트
      data: { comment, amount },
    });

    // 해당 기업의 virtualInvestment 금액 업데이트
    await prisma.company.update({
      where: { id: investment.companyId },
      data: {
        virtualInvestment: {
          // 차이만큼 virtualInvestment를 업데이트
          increment: amountDiff,
        },
      },
    });
    res.send(transformBigInt(updatedInvestment));
  });
};

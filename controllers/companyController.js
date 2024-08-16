import { PrismaClient } from "@prisma/client";
import { assert } from "superstruct";
import { Uuid } from "../structs/validateUuid.js";
import { replaceBigIntToString } from "../utils/stringifyBigInt.js";
import transformBigInt from "../utils/transformBigInt.js";

const prisma = new PrismaClient();

export const getCompanies = async (req, res) => {
  const { keyword = "" } = req.query;
  const { lastId, limit = 10, orderBy } = req.query;

  let sortOption;
  switch (orderBy) {
    case "highestInvestment":
      sortOption = { actualInvestment: "desc" };
      break;
    case "lowestInvestment":
      sortOption = { actualInvestment: "asc" };
      break;
    case "highestRevenue":
      sortOption = { revenue: "desc" };
      break;
    case "lowestRevenue":
      sortOption = { revenue: "asc" };
      break;
    case "highestEmployees":
      sortOption = { totalEmployees: "desc" };
      break;
    case "lowestEmployees":
      sortOption = { totalEmployees: "asc" };
      break;
    default:
      sortOption = { actualInvestment: "desc" };
  }

  const searchQuery = {
    OR: [
      { name: { contains: keyword } },
      { description: { contains: keyword } },
    ],
  };

  const companies = await prisma.company.findMany({
    where: searchQuery,
    orderBy: sortOption,
    take: parseInt(limit),
    skip: lastId ? 1 : 0,
    cursor: lastId ? { id: lastId } : undefined,
    select: {
      id: true,
      name: true,
      description: true,
      actualInvestment: true,
      revenue: true,
      totalEmployees: true,
      categories: { select: { name: true } },
    },
  });

  const bigIntToString = companies.map((company) => ({
    ...company,

    actualInvestment: company.actualInvestment.toString(),
    revenue: company.revenue.toString(),
  }));

  const nextCursor =
    companies.length === limit ? companies[companies.length - 1].id : null;

  res.status(200).send({ nextCursor, list: bigIntToString });
};

export const getCompanyById = async (req, res) => {
  const { id } = req.params;
  assert(id, Uuid);

  const company = await prisma.company.findUniqueOrThrow({
    where: { id },
  });

  const bigIntToString = JSON.stringify(company, replaceBigIntToString);

  res.setHeader("Content-Type", "application/json");
  res.status(200).send(bigIntToString);
};

// 전체 기업 투자 현황 조회
export const getInvestmentStatus = async (req, res) => {
  const {
    sortBy = "virtualInvestment",
    order = "desc",
    cursor,
    take = 10,
  } = req.query;

  // 정렬 기준에 따라 정렬 옵션을 설정하는 switch 문
  let orderBy = {};
  switch (sortBy) {
    case "virtualInvestment":
      orderBy = { virtualInvestment: order };
      break;
    case "actualInvestment":
      orderBy = { actualInvestment: order };
      break;
    default:
      // 기본값을 가상 투자 금액 기준으로 설정
      orderBy = { virtualInvestment: order };
      break;
  }

  // 페이지네이션 및 정렬을 포함한 회사 데이터 조회
  const companies = await prisma.company.findMany({
    // 커서가 있는지 확인
    where: cursor
      ? {
          // 두 조건 만족하는 데이터 가져옴
          AND: [
            // 이전 페이지의 마지막 항목과 동일한 id를 가진 데이터 제외, 중복 방지
            { id: { not: cursor } },
            {
              // 정렬기준(actual or virtual)에 따라 정렬 방식이 desc인지 asc인지 확인
              // desc이면 가리키는 항목의 sortBy 값보다 작거나 같은 데이터를 가져옴
              [sortBy]: {
                [order === "desc" ? "lte" : "gte"]:
                  // id가 cursor의 값과 일치하는 데이터를 조회
                  // 데이터에서 sortBy 값을 가져옴
                  (
                    await prisma.company.findUnique({ where: { id: cursor } })
                  )[sortBy],
              },
            },
          ],
        }
      : {},
    orderBy: [
      orderBy,
      { id: "desc" }, // 같은 값을 가지는 항목들에 대해 고유 ID로 정렬하여 항상 동일한 순서를 유지
    ],
    take: parseInt(take), // 가져올 항목 수
    include: { investments: true, categories: true },
  });

  // 조회된 데이터 변환
  const status = companies.map((company) => ({
    id: company.id,
    name: company.name,
    description: company.description,
    categories: company.categories.map((category) => category.name), // 카테고리 이름 배열로 변환
    virtualInvestment: company.virtualInvestment.toString(), // 가상 투자 총액을 문자열로 변환
    actualInvestment: company.actualInvestment.toString(), // 실제 투자 총액을 문자열로 변환
  }));

  // 다음 페이지 커서를 설정
  // null: 의도적으로 `값이 없다` 라는 의미를 전달
  // undefined: 변수 선언 되었지만 아직 값이 할당되지 않았을 때 자동으로 부여
  // 프로그래머가 의도적으로 undefined를 할당하는 경우는 거의 없음
  const nextCursor =
    companies.length === parseInt(take)
      ? companies[companies.length - 1].id
      : null;

  res.status(200).send({ nextCursor, list: transformBigInt(status) });
};

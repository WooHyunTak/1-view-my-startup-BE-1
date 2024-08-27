import { PrismaClient } from "@prisma/client";
import { assert } from "superstruct";
import { Uuid } from "../structs/validateUuid.js";
import { replaceBigIntToString } from "../utils/stringifyBigInt.js";
import { parse } from "dotenv";

const prisma = new PrismaClient();

export const getCompanies = async (req, res) => {
  const { keyword = "" } = req.query;
  const { sortBy = "actualInvestment", order = "desc" } = req.query;
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;

  // page가 1이면 offset 0
  const offset = (page - 1) * limit;

  const sortOption = { [sortBy]: order };

  const searchQuery = {
    OR: [
      { name: { contains: keyword } },
      { description: { contains: keyword } },
    ],
  };

  //2가지 쿼리 $transaction 이용해서 데이터 일관성 유지
  //totalCount , company list
  const [totalCount, companies] = await prisma.$transaction([
    prisma.company.count({
      where: searchQuery,
    }),
    prisma.company.findMany({
      where: searchQuery,
      orderBy: [sortOption, { id: "desc" }],
      take: limit,
      skip: offset || 0,
      select: {
        id: true,
        name: true,
        brandColor: true,
        description: true,
        actualInvestment: true,
        revenue: true,
        totalEmployees: true,
        categories: { select: { name: true } },
      },
    }),
  ]);

  //bigInt to string
  const companiesWithRank = companies.map((company, index) => ({
    ...company,
    categories: company.categories.map((category) => category.name),
    actualInvestment: company.actualInvestment.toString(),
    revenue: company.revenue.toString(),
    rank: offset + (index + 1),
  }));

  res.status(200).send({ totalCount, list: companiesWithRank });
};

export const getCompanyById = async (req, res) => {
  const { id } = req.params;
  assert(id, Uuid);

  // 회사 정보를 가져오고, investments를 투자금 순으로 정렬
  const company = await prisma.company.findUniqueOrThrow({
    where: { id },
    include: {
      investments: {
        orderBy: {
          amount: "desc",
        },
      },
      categories: true,
    },
  });

  // investments에 순위 추가
  const investmentsWithRank = company.investments.map((investment, index) => ({
    ...investment,
    rank: index + 1,
  }));

  // 순위가 추가된 investments로 company 객체 업데이트
  const companyWithRankedInvestments = {
    ...company,
    investments: investmentsWithRank,
  };

  const bigIntToString = JSON.stringify(
    companyWithRankedInvestments,
    replaceBigIntToString
  );

  res.setHeader("Content-Type", "application/json");
  res.status(200).send(bigIntToString);
};

// 전체 기업 투자 현황 조회
export const getInvestmentStatus = async (req, res) => {
  const {
    sortBy = "virtualInvestment",
    order = "desc",
    page = 1,
    limit = 10,
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

  // offset 계산
  const offset = (parseInt(page) - 1) * parseInt(limit);

  //where 투자금이 0 이상인 기업만 조회.
  const hasInvestments = { virtualInvestment: { gt: 0 } };

  // 페이지네이션 및 정렬을 포함한 회사 데이터 조회
  const companies = await prisma.company.findMany({
    where: hasInvestments,
    skip: offset,
    take: parseInt(limit),
    orderBy: [
      orderBy,
      { id: "desc" }, // 같은 값을 가지는 항목들에 대해 고유 ID로 정렬하여 항상 동일한 순서를 유지
    ],
    take: parseInt(limit), // 가져올 항목 수
    include: { investments: true, categories: true },
  });

  // 조회된 데이터 변환
  const status = companies.map((company, index) => ({
    id: company.id,
    name: company.name,
    description: company.description,
    brandColor: company.brandColor,
    categories: company.categories.map((category) => category.name), // 카테고리 이름 배열로 변환
    virtualInvestment: company.virtualInvestment.toString(), // 가상 투자 총액을 문자열로 변환
    actualInvestment: company.actualInvestment.toString(), // 실제 투자 총액을 문자열로 변환
    totalEmployees: company.totalEmployees,
    rank: offset + index + 1, // sortBy에 따라 기업 랭크 추가
  }));

  // 페이지네이션 정보 계산
  const totalCount = await prisma.company.count({ where: hasInvestments }); // 전체 항목
  const totalPage = Math.ceil(totalCount / limit); // 전체 페이지 수 계산
  const hasNextPage = page < totalPage; // 다음 페이지가 있는지 확인

  res.status(200).send({
    currentPage: page,
    totalPage: totalPage,
    totalCount: totalCount,
    hasNextPage: hasNextPage,
    list: status,
  });
};

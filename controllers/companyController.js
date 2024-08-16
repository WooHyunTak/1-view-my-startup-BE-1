import { PrismaClient } from "@prisma/client";
import { assert } from "superstruct";
import { Uuid } from "../structs/validateUuid.js";
import { replaceBigIntToString } from "../utils/stringifyBigInt.js";

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
    OR: [{ name: { contains: keyword } }, { description: { contains: keyword } }],
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

  const nextCursor = companies.length === limit ? companies[companies.length - 1].id : null;

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

import { PrismaClient } from "@prisma/client";
import { serializeBigInt } from "../utils/serializeBigInt.js";

const prisma = new PrismaClient();

//반복되는 쿼리를 줄리이기 위함
//함수 내부에서 빅인트처리의 로직도 함께 호출한다.
const fetchCompanies = async (query) => {
  const companies = await prisma.company.findMany(query);
  return companies.map(serializeBigInt);
};

export async function getComparison(req, res) {
  const { comparisonIds } = req.body;
  const { orderBy = "revenue", scending = "asc" } = req.query;
  let orderByQuery = {};
  switch (orderBy) {
    case "revenue":
      if (scending === "asc") {
        orderByQuery = { revenue: "asc" };
      } else {
        orderByQuery = { revenue: "desc" };
      }
      break;
    case "totalEmployees":
      if (scending === "asc") {
        orderByQuery = { totalEmployees: "asc" };
      } else {
        orderByQuery = { totalEmployees: "desc" };
      }
      break;
    case "actualInvestment":
      if (scending === "asc") {
        orderByQuery = { actualInvestment: "asc" };
      } else {
        orderByQuery = { actualInvestment: "desc" };
      }
      break;
    default:
      orderByQuery = { revenue: "asc" };
  }

  const dataQuery = {
    orderBy: orderByQuery,
    where: {
      id: {
        in: comparisonIds,
      },
    },
  };
  const data = await fetchCompanies(dataQuery);
  if (data) {
    res.send(data);
  } else {
    res.status(404).send({ message: "기업정보를 찾을수 없습니다." });
  }
}

export async function getCompaniesRank(req, res) {
  const { id } = req.params;
  const { orderBy, scending } = req.query;
  let orderByQuery = {};
  switch (orderBy) {
    case "revenue":
      if (scending === "asc") {
        orderByQuery = "revenue ASC";
      } else {
        orderByQuery = "revenue DESC";
      }
      break;
    case "totalEmployees":
      if (scending === "asc") {
        orderByQuery = "totalEmployees ASC";
      } else {
        orderByQuery = "totalEmployees DESC";
      }
      break;
    default:
      orderByQuery = "revenue ASC";
  }
  try {
    const data = await prisma.$queryRaw`
    WITH RankedCompanies AS (
      SELECT
        *,
        ROW_NUMBER() OVER (ORDER BY revenue ASC) AS rank
      FROM "public"."Company"
    ),
    TargetRank AS (
      SELECT rank
      FROM RankedCompanies
      WHERE id = ${id}
    ),
    RackRange AS (
       SELECT rank
       FROM TargetRank
    )
    SELECT * FROM (
      SELECT * FROM RankedCompanies
      WHERE rank BETWEEN (SELECT rank - 2 FROM RackRange) AND (SELECT rank + 2 FROM RackRange)

      UNION

      SELECT * FROM RankedCompanies
      where rank > (select rank from TargetRank)
      order by revenue
      limit 5
    ) AS combined
    ORDER BY ${orderByQuery}
    LIMIT 5
    `;
    res.send(serializeBigInt(data));
  } catch (e) {
    res.status(400).send({ message: e.message });
  }
}

export async function getSelections(req, res) {
  const { orderBy = "", scending = "asc", limit = 10, cursor = "" } = req.query;
  let orderByQuery = {};
  switch (orderBy) {
    case "selectedCount":
      if (scending === "asc") {
        orderByQuery = { selectedCount: "asc" };
      } else {
        orderByQuery = { selectedCount: "desc" };
      }
      break;
    case "comparedCount":
      if (scending === "asc") {
        orderByQuery = { comparedCount: "asc" };
      } else {
        orderByQuery = { comparedCount: "desc" };
      }
      break;
    default:
      orderByQuery = { selectedCount: "desc" };
  }

  const compared = {
    orderBy: orderByQuery,
    take: limit + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
  };

  const data = await fetchCompanies(compared);

  if (data) {
    const nextData = compared.length > limit;
    const nextCursorId = nextData ? compared[limit - 1].id : null;

    const returnData = {
      list: data.slice(0, limit),
      nextCursor: nextCursorId,
    };
    res.send(returnData);
  } else {
    res.status(404).send({ message: "기업정보를 찾을수 없습니다." });
  }
}

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

export async function getCompanyRank(req, res) {
  const { id } = req.params;
  const { orderBy, scending } = req.query;
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
    default:
      orderByQuery = { revenue: "asc" };
  }

  let returnData = {};

  const prevCompany = {
    orderBy: orderByQuery,
    where: {
      id: {
        lt: id,
      },
    },
    take: 2,
  };

  const prevCompanyData = await fetchCompanies(prevCompany);

  if (prevCompany.length < 2) {
    const myCompany = {
      orderBy: orderByQuery,
      cursor: {
        id: id,
      },
      take: 4,
    };
    const myCompanyData = await fetchCompanies(myCompany);
    returnData = [...prevCompanyData, ...myCompanyData];
    res.send(returnData);
    return;
  }

  const myCompanyPromise = prisma.company.findUniqueOrThrow({
    where: { id },
  });

  const nextCompany = {
    orderBy: orderByQuery,
    where: {
      id: {
        gt: id,
      },
    },
    take: 2,
  };

  const nextCompanyPromise = fetchCompanies(nextCompany);

  const [myCompany, nextCompanyData] = await Promise.all([
    myCompanyPromise,
    nextCompanyPromise,
  ]);

  const myCompanyData = serializeBigInt(myCompany);
  returnData = [...prevCompanyData, myCompanyData, ...nextCompanyData];
  res.send(returnData);
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
        ROW_NUMBER() OVER (ORDER BY revenue DESC) AS rank
      FROM "public"."Company"
    ),
    TargetRank AS (
      SELECT rank
      FROM RankedCompanies
      WHERE id = ${id}
    )
    SELECT * FROM RankedCompanies
    WHERE rank BETWEEN (SELECT rank - 2 FROM TargetRank) AND (SELECT rank + 2 FROM TargetRank)
    ORDER BY ${orderByQuery};
    `;
    res.send(serializeBigInt(data));
  } catch (e) {
    res.status(404).send({ message: e.message });
  }
}

export async function getSelections(req, res) {
  const {
    orderBy = "revenue",
    scending = "asc",
    limit = 10,
    cursor = "",
  } = req.query;
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
      orderByQuery = { selectedCount: "asc" };
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

import { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { serializeBigInt } from "../utils/serializeBigInt.js";
import transformBigInt from "../utils/transformBigInt.js";

const prisma = new PrismaClient();

//반복되는 쿼리를 줄리이기 위함
//함수 내부에서 빅인트처리의 로직도 함께 호출한다.
const fetchCompanies = async (query) => {
  const companies = await prisma.company.findMany(query);
  return companies.map(serializeBigInt);
};

export async function getComparison(req, res) {
  const { comparisonIds } = req.body;
  const { sortBy = "revenue", order = "asc" } = req.query;
  let orderByQuery = { [sortBy]: order };

  const data = await prisma.company.findMany({
    orderBy: orderByQuery,
    where: {
      id: {
        in: comparisonIds,
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      brandColor: true,
      actualInvestment: true,
      brandColor: true,
      revenue: true,
      totalEmployees: true,
      categories: { select: { name: true } },
    },
  });
  if (data) {
    const resData = serializeBigInt(
      data.map((item) => ({
        ...item,
        categories: item.categories.map((category) => category.name),
      }))
    );
    res.send(resData);
  } else {
    res.status(404).send({ message: "기업정보를 찾을수 없습니다." });
  }
}

export async function getCompaniesRank(req, res) {
  const { id } = req.params;
  //기본값
  const { order = "ASC" } = req.query;
  const sortBy = `"${req.query.sortBy || "revenue"}"`;
  //그냥 템플릿을 사용하면 프리즈마에서 sql로 인식을 못함 prisma.sql로 변환
  const orderByRank = Prisma.sql([sortBy]);
  const orderbyView = Prisma.sql([order]);
  try {
    const data = await prisma.$queryRaw`
    WITH RankedCompanies AS (
      SELECT
      c.*,
      ROW_NUMBER() OVER (ORDER BY ${orderByRank} ${orderbyView}) AS rank
      FROM "public"."Company" c
    ),
    TargetRank AS (
      SELECT rank
      FROM RankedCompanies
      WHERE id = ${id}
    ),
    RackRange AS (
       SELECT rank
       FROM TargetRank
    ),
    RankedAndCategorized AS (
    SELECT
        rc.*,
        jsonb_agg(cat.name) AS categories
    FROM RankedCompanies rc
    LEFT JOIN "public"."_CompanyCategories" cc ON rc.id::text = cc."B"
    LEFT JOIN "public"."Category" cat ON cc."A"::text = cat.id::text
    GROUP BY rc.id,rc.rank, rc."name", rc."description",
	rc."brandImage", rc."brandColor", rc."actualInvestment", rc."virtualInvestment",
	rc."revenue",
	rc."totalEmployees",
	rc."selectedCount",rc."comparedCount",rc."createdAt",
	rc."updatedAt"
),
    FilteredCompanies AS (
    SELECT * FROM (
      SELECT * FROM RankedAndCategorized
      WHERE rank BETWEEN (SELECT rank - 2 FROM RackRange) AND (SELECT rank + 2 FROM RackRange)

      UNION
      -- 선택 기업이 상위 2위 이상이라 상위의 2개의 로우값이 부족할 경우 석택기업을 포함한 5개의 기업을 보장함
      SELECT * FROM RankedAndCategorized
      where rank > (select rank from TargetRank)
      order by rank 
      limit 5
    ) AS combined
    ORDER BY rank --${orderbyView}
    LIMIT 5
  )
  SELECT *
  FROM FilteredCompanies
  ORDER BY rank;
  `;
    res.send(serializeBigInt(data));
  } catch (e) {
    res.status(400).send({ message: e.message });
  }
}

//비교 현황 페이지용 기업리스트 (GET)
export async function getComparisonStatus(req, res) {
  const { order = "desc", sortBy = "selectedCount" } = req.query;
  const limit = parseInt(req.query.limit) || 10;
  //page기본값 1
  const page = parseInt(req.query.page) || 1;
  const offset = page ? (page - 1) * limit : 0;

  const sortOptions = { [sortBy]: order };

  const [totalCount, companies] = await prisma.$transaction([
    prisma.company.count(),
    prisma.company.findMany({
      //데이터 동일성 위해 정렬할때 name asc 순으로
      orderBy: [sortOptions, { name: "asc" }],
      take: limit,
      skip: offset || 0,
      select: {
        id: true,
        name: true,
        description: true,
        brandColor: true,
        selectedCount: true,
        comparedCount: true,
        categories: { select: { name: true } },
      },
    }),
  ]);

  const companyListWithRank = companies.map((company, index) => ({
    ...company,
    categories: company.categories.map((category) => category.name),
    rank: offset + (index + 1),
  }));

  res.status(200).send({ totalCount, list: companyListWithRank });
}

export async function fetchCompanyCounts(req, res) {
  const { myCompanyId, comparisonIds } = req.body;
  const data = await prisma.$transaction([
    prisma.company.update({
      where: {
        id: myCompanyId,
      },
      data: {
        selectedCount: {
          increment: 1,
        },
      },
    }),
    prisma.company.updateMany({
      where: {
        id: {
          in: comparisonIds,
        },
      },
      data: {
        comparedCount: {
          increment: 1,
        },
      },
    }),
  ]);
  if (data) {
    res.sendStatus(204);
  } else {
    res.status(404).send({ message: "데이터를 찾을수 없습니다." });
  }
}

import express from "express";
import * as company from "../controllers/companyController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const app = express.Router();

app.get("/", asyncHandler(company.getCompanies));
app.get("/:id", asyncHandler(company.getCompanyById));
// 전체 기업 투자 현황 조회(페이네이션, 정렬 포함)
app.get("/investments/status", asyncHandler(company.getInvestmentStatus));

export default app;

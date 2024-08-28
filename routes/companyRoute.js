import express from "express";
import * as company from "../controllers/companyController.js";
import { getComparisonStatus } from "../controllers/comparisonController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const app = express.Router();

app.get("/", asyncHandler(company.getCompanies));
app.get("/investments-status", asyncHandler(company.getInvestmentStatus));
app.get("/comparisons-status", asyncHandler(getComparisonStatus));
app.get("/:id", asyncHandler(company.getCompanyById));

export default app;

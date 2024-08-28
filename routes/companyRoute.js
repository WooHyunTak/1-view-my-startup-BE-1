import express from "express";
import * as company from "../controllers/companyController.js";
import { getComparisonStatus } from "../controllers/comparisonController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const app = express.Router();

app.get("/", asyncHandler(company.getCompanies));
app.get("/:id", asyncHandler(company.getCompanyById));
app.get("/investments-status", asyncHandler(company.getInvestmentStatus));
app.get("/comparison-status", asyncHandler(getComparisonStatus));

export default app;

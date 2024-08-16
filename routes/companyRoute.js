import express from "express";
import * as company from "../controllers/companyController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const app = express.Router();

app.get("/", asyncHandler(company.getCompanies));
app.get("/:id", asyncHandler(company.getCompanyById));

export default app;

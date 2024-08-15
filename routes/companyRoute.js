import express from "express";
import * as company from "../controllers/companyController.js";
import { asyncErrorHandler } from "../validations/asyncErrorHandler.js";

const app = express.Router();

app.get("/", asyncErrorHandler(company.getCompanies));
app.get("/:id", asyncErrorHandler(company.getCompanyById));

export default app;

import express from "express";

import * as company from "../controllers/companyController.js";

const app = express.Router();

app.get("/", company.getCompanies);

export default app;

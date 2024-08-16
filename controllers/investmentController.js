import { PrismaClient } from "@prisma/client";
import { replaceBigIntToString } from "../utils/stringifyBigInt.js";

const prisma = new PrismaClient();

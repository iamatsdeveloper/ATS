import express from "express";
import { fetchLogs } from "../controllers/logController.js";
import { fetchConfigLogs, handleTrade, updateDailyTradeConfig } from "../controllers/tradeController.js";

/* Routes */
const router = express.Router();

//logs
router.get("/logs/fetch", fetchLogs);
router.get("/logs/fetchconfig", fetchConfigLogs);

//trade config
router.post("/trade", handleTrade);
router.post("/trade/updateDailyTradeConfig", updateDailyTradeConfig);

export default router;
import express from "express";
import { fetchConfigLogs, fetchLogs } from "../controllers/logController.js";
import { handleTrade, handleTradeSettings } from "../controllers/tradeController.js";

/* Routes */
const router = express.Router();

//logs
router.get("/logs/fetch", fetchLogs);
router.get("/logs/fetchconfig", fetchConfigLogs);

//trade config
router.post("/webhook/trade", handleTrade);
router.post("/trade/settings", handleTradeSettings);

export default router;
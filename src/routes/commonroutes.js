import express from "express";
import { fetchConfigLogs, fetchLogs } from "../controllers/logController.js";
import { handleTrade, handleTradeSettings, deleteData } from "../controllers/tradeController.js";

/* Routes */
const router = express.Router();

//logs
router.get("/logs/fetch", fetchLogs);
router.get("/logs/fetchconfig", fetchConfigLogs);

//trade config
router.post("/webhook/trade", handleTrade);
// router.post("/webhook/handleTrade", handleTrade1);
router.post("/trade/settings", handleTradeSettings);

//delete
router.post("/deletedata", deleteData);

export default router;
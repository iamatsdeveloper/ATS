
import TradeConfig from "../models/tradeConfig.js";
import TradeLogs from "../models/tradeLogs.js";

/* Fetching logs */
export const fetchLogs = async (req, res) => {
    try {
        const data = await TradeLogs.find().select('-_id unique_id type request response status_code status alert_at createdAt updatedAt');

        return res.status(200).json({
            success: true,
            logs: data,
            message: "Data Fetch Successfully."
        });
    } catch (error) {
        if (error.response) {
            console.error(`Error: ${error.response.status} ${error.response.statusText}`);
        } else {
            console.error(`Caught Error: ${error.message}`);
        }
    }
};

export const fetchConfigLogs = async (req, res) => {
    try {
        const data = await TradeConfig.find().select('-_id unique_id total_trades quantity trade_per_day createdAt updatedAt');

        return res.status(200).json({
            success: true,
            logs: data,
            message: "Data Fetch Successfully."
        });
    } catch (error) {
        if (error.response) {
            console.error(`Error: ${error.response.status} ${error.response.statusText}`);
        } else {
            console.error(`Caught Error: ${error.message}`);
        }
    }
};
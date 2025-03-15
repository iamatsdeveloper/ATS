
import TradeConfig from "../models/tradeConfig.js";
import TradeLogs from "../models/tradeLogs.js";
import Trades from "../models/trades.js";
import TradeSettings from "../models/tradeSettings.js";

/* Fetching logs */
export const fetchLogs = async (req, res) => {
    try {
        const data = await TradeLogs.find()
        .select('-_id trade_id type request response status_code status alert_at createdAt updatedAt')
        .sort({ createdAt: -1 });

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
        const data = await TradeConfig.find()
        .select('-_id unique_id total_trades quantity trade_per_day createdAt updatedAt')
        .sort({ createdAt: -1 });

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

export const fetchTradeLogs = async (req, res) => {
    try {
        const data = await Trades.find()
        .select('-_id trade_id status action pnl stoploss quantity createdAt updatedAt')
        .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            trades: data,
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

export const fetchTradeSettings = async (req, res) => {
    try {
        const data = await TradeSettings.findOne()
        .select('-_id quantity target_1 target_2 target_3 trade_per_day risk_per_trade risk_per_day');

        return res.status(200).json({
            success: true,
            settings: data,
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
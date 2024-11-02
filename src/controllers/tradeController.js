
import axios from "axios";
import dotenv from "dotenv";
import TradeLogs from "../models/tradeLogs.js";
import TradeConfig from "../models/tradeConfig.js";
import EmailFetcher from "../utils/emailFetcher.js";

//Mail Config and load environment variables
const emailFetcher = new EmailFetcher();
dotenv.config();

/* Inserting/Updating TradeDetails */
export const handleTrade = async (jsondata, alertTime) => {
// export const handleTrade = async (req, res) => {
    let log = undefined;
    try {

        // const { jsondata } = req.body;

        // const now = new Date();
        // const alertTime = now.toISOString();
        const UniqueId = Date.now();
        const exit = jsondata[0]?.EXIT;

        const records = await getTodaysRecord();

        if (exit || exit == "true") {
            if (records) {

                await TradeConfig.findByIdAndUpdate(records._id, {
                    total_trades: records.total_trades + 1,
                });

                if (records.total_trades + 1 >= records.trade_per_day) {
                    emailFetcher.stopPolling();
                    console.log("stopped!");
                }
            }
        }

        jsondata[0].Q = records.quantity !== null ? records.quantity : jsondata[0].Q;

        const newLog = new TradeLogs({
            unique_id: UniqueId,
            type: jsondata[0]?.TT,
            request: JSON.stringify(jsondata),
            alert_at: alertTime
        });
        log = await newLog.save();

        delete jsondata[0]?.EXIT;
        const response = await axios.post(process.env.TRADE_URL, jsondata);

        await TradeLogs.findByIdAndUpdate(log._id, {
            response: JSON.stringify(response.data ?? ""),
            status_code: response?.status,
            status: true
        });

    } catch (error) {
        console.log(error);

        await TradeLogs.findByIdAndUpdate(log._id, {
            response: error.response,
            status_code: error?.response?.status,
            status: false
        });
    }
};

/* Inserting/Updating TradeDetails */
export const updateDailyTradeConfig = async (req, res) => {
    try {
        const { quantity = null, trade_per_day = 3 } = req.body;

        const records = await getTodaysRecord();

        if (records) {
            await TradeConfig.findByIdAndUpdate(records._id, {
                quantity: quantity,
                trade_per_day: trade_per_day
            });
        }
        else {
            const UniqueId = Date.now();
            const newconfig = new TradeConfig({
                unique_id: UniqueId,
                quantity: quantity,
                trade_per_day: trade_per_day
            });
            await newconfig.save();
        }

        //Start polling mail's
        emailFetcher.connect();
        emailFetcher.startPolling();

        return res.status(200).json({
            success: true,
            message: "Success."
        });

    } catch (error) {
        console.log(error);
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

const getTodaysRecord = async () => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0); // Set to midnight

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999); // Set to the end of the day

        const records = await TradeConfig.findOne({
            createdAt: {
                $gte: startOfToday,
                $lte: endOfToday,
            },
        });

        return records;
    } catch (error) {
        console.log(error);
    }
};
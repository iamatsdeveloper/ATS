
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
        let request = null;

        const tradelog = await getTodaysRecord(true);
        const records = await getTodaysRecord();

        const quantity = records.quantity !== null ? records.quantity : jsondata[0].Q;
        const exit = jsondata[0]?.EXIT;

        if(tradelog == null && (exit || exit == "true"))
        {
            return;
        }

        if (exit || exit == "true") {

            request = {
                "Market": "CRYPTO",
                "Broker": jsondata[0].E,
                "Setup": "5EMA RSI BUY/SELL",
                "TradeStatus": "Closed",
                "Action": jsondata[0].TT,
                "Symbol": jsondata[0].TS,
                "EntryDate": getFormattedDate(tradelog.createdAt),
                "ExitDate": getFormattedDate(),
                "EntryPrice": jsondata[0].EPRICE,
                "ExitPrice": jsondata[0].PRICE,
                "StopLoss": jsondata[0].SL,
                "Quantity": quantity
            };

            if (records) {
                await TradeConfig.findByIdAndUpdate(records._id, {
                    total_trades: records.total_trades + 1,
                });

                if (records.total_trades + 1 >= records.trade_per_day) {
                    emailFetcher.stopPolling();
                }
            }
        }

        const requestJson = request == null ? jsondata : request;

        const newLog = new TradeLogs({
            unique_id: UniqueId,
            type: request == null ? "BUY" : "SELL",
            request: JSON.stringify(requestJson),
            response: JSON.stringify({"success":true,"message":"Saved."}),
            alert_at: alertTime
        });
        log = await newLog.save();

        if(request) {
            const response = await axios.post(process.env.TRADE_URL, requestJson);
    
            await TradeLogs.findByIdAndUpdate(log._id, {
                response: JSON.stringify(response.data ?? ""),
                status_code: response?.status,
                status: true
            });
        }

        return res.status(200).json({
            success: true,
            message: "Success."
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

const getTodaysRecord = async (flag = false) => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0); // Set to midnight

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999); // Set to the end of the day

        let records = null;
        if(flag) {
            records = await TradeLogs.findOne({
                createdAt: {
                    $gte: startOfToday,
                    $lte: endOfToday,
                },
            }).sort({ _id: -1 });
        }
        else {
            records = await TradeConfig.findOne({
                createdAt: {
                    $gte: startOfToday,
                    $lte: endOfToday,
                },
            });
        }

        return records;
    } catch (error) {
        console.log(error);
    }
};

const getFormattedDate = (date = null) => {
    const now = date == null ? new Date() : new Date(date);
  
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed, so we add 1
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
  
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}
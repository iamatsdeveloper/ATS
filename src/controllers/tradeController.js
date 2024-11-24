import axios from "axios";
import dotenv from "dotenv";
import TradeLogs from "../models/tradeLogs.js";
import TradeConfig from "../models/tradeConfig.js";
import TradeSettings from "../models/tradeSettings.js";

//load environment variables
dotenv.config();

/* Inserting/Updating TradeDetails */
export const handleTrade = async (req, res) => {
    let log = undefined;
    try {

        const { TextBody: data } = req.body;
        console.log(req.body);
        
        // const jsondata = JSON.parse(data.text.replace("\n", ""), null, 2);

        // if(Array.isArray(jsondata)) {

        //     const now = new Date();
        //     const alertTime = now.toISOString();
        //     const UniqueId = Date.now();
        //     let request = null;
    
        //     const tradelog = await getTodaysRecord(true);
        //     const records = await getTodaysRecord();
    
        //     if (!records) {
        //         const records = await TradeSettings.findOne();
        //         await updateDailyTradeConfig(records.quantity, records.trade_per_day);
        //     }
    
        //     const quantity = records.quantity !== null ? records.quantity : jsondata[0].Q;
        //     const exit = jsondata[0]?.EXIT;
    
        //     if (tradelog == null && (exit || exit == "true")) {
        //         return res.status(200).json({
        //             success: false,
        //             message: "Unable to process trade without entry."
        //         });
        //     }
    
        //     if (exit || exit == "true") {
        //         const tradelogJson = JSON.parse(tradelog.request);
    
        //         request = {
        //             "Market": "CRYPTO",
        //             "Broker": jsondata[0].E,
        //             "Setup": "5EMA RSI BUY/SELL",
        //             "TradeStatus": "Closed",
        //             "Action": tradelogJson[0].TT,
        //             "Symbol": jsondata[0].TS,
        //             "EntryDate": getFormattedDate(tradelog.createdAt),
        //             "ExitDate": getFormattedDate(),
        //             "EntryPrice": tradelogJson[0].EPRICE,
        //             "ExitPrice": jsondata[0].PRICE,
        //             "StopLoss": jsondata[0].SL,
        //             "Quantity": quantity
        //         };
    
        //         if (records) {
    
        //             if (records.total_trades + 1 >= records.trade_per_day) {
        //                 return res.status(200).json({
        //                     success: false,
        //                     message: "Daily Trade Limit Reached."
        //                 });
        //             }
                    
        //             await TradeConfig.findByIdAndUpdate(records._id, {
        //                 total_trades: records.total_trades + 1,
        //             });
        //         }
        //     }
    
        //     const requestJson = request == null ? jsondata : request;
    
        //     const newLog = new TradeLogs({
        //         unique_id: UniqueId,
        //         type: request == null ? jsondata[0].TT : `EXIT ${jsondata[0].TT}`,
        //         request: JSON.stringify(requestJson),
        //         response: JSON.stringify({ "success": true, "message": "Saved." }),
        //         alert_at: alertTime
        //     });
    
        //     log = await newLog.save();
    
        //     if (request) {
        //         const response = await axios.post(process.env.TRADE_URL, requestJson);
    
        //         await TradeLogs.findByIdAndUpdate(log._id, {
        //             response: JSON.stringify(response.data ?? ""),
        //             status_code: response?.status,
        //             status: true
        //         });
        //     }
    
        //     return res.status(200).json({
        //         success: true,
        //         message: "Success."
        //     });
        // }
        // else {
        //     console.log(jsondata);
        // }
        return res.status(200).json({
            success: false,
            message: "Invalid Request."
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
export const handleTradeSettings = async (req, res) => {
    try {
        const { quantity = null, trade_per_day = 3 } = req.body;

        const records = await TradeSettings.findOne();

        if (records) {
            await TradeSettings.findByIdAndUpdate(records._id, {
                quantity: quantity,
                trade_per_day: trade_per_day
            });
        }
        else {
            const tradeSettings = new TradeSettings({
                quantity: quantity,
                trade_per_day: trade_per_day
            });
            await tradeSettings.save();
        }

        const status = await updateDailyTradeConfig(quantity, trade_per_day);

        return res.status(200).json({
            success: status,
            message: status ? "Success." : "Failure."
        });

    } catch (error) {
        console.log(error);
    }
};

/* Inserting/Updating TradeConfig */
const updateDailyTradeConfig = async (quantity = null, trade_per_day = 3) => {
    try {
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

        return true;

    } catch (error) {
        return false;
    }
};

const getTodaysRecord = async (flag = false) => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0); // Set to midnight

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999); // Set to the end of the day

        let records = null;
        if (flag) {
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
import axios from "axios";
import dotenv from "dotenv";
import TradeLogs from "../models/tradeLogs.js";
import TradeConfig from "../models/tradeConfig.js";
import TradeSettings from "../models/tradeSettings.js";
import { countDecimalPlaces, getFormattedDate, getISTISOString } from "../helpers/comnFuncHelper.js";
import Trades from "../models/trades.js";

//load environment variables
dotenv.config();

/* Inserting/Updating TradeDetails */
export const handleTrade = async (req, res) => {
    let log = null;
    try {

        const { textBody: data, date: alertTime } = req.body;

        if (data !== undefined) {
            const jsondata = JSON.parse(data.replace("\n", ""), null, 2);

            if (Array.isArray(jsondata)) {

                const UniqueId = Date.now();
                let request = null;
                let tradeId = null;

                const tradelog = await getTodaysRecord(true);
                let tradelogJson = null;

                let records = await getTodaysRecord();
                let tradeSettings = await TradeSettings.findOne();

                if (!records) {
                    await updateDailyTradeConfig(tradeSettings.quantity, tradeSettings.trade_per_day);
                    records = await getTodaysRecord();
                }

                let quantity = records.quantity !== null ? records.quantity : jsondata[0].Q;
                quantity = await getAdjustedRiskQantity(jsondata[0], quantity, tradeSettings.risk_per_trade, tradeSettings.risk_per_day);

                const exit = jsondata[0]?.EXIT;

                if (tradelog == null && (exit || exit == "true")) {
                    return res.status(200).json({
                        success: false,
                        message: "Unable to process trade without entry."
                    });
                }
                if (records) {
                    if (records.total_trades >= records.trade_per_day) {
                        return res.status(200).json({
                            success: false,
                            message: "Daily Trade Limit Reached."
                        });
                    }
                }

                if (exit || exit == "true") {

                    tradelogJson = JSON.parse(tradelog.request);
                    jsondata[0].EPRICE = tradelogJson[0].EPRICE;
                    const exitPrice = await getCalculatedAvgPrice(jsondata, quantity);

                    request = {
                        "Market": "CRYPTO",
                        "Broker": jsondata[0].E,
                        "Setup": "5EMA RSI BUY/SELL",
                        "TradeStatus": "Closed",
                        "Action": tradelogJson[0].TT,
                        "Symbol": jsondata[0].TS,
                        "EntryDate": getFormattedDate(tradelog.createdAt),
                        "ExitDate": getFormattedDate(),
                        "EntryPrice": tradelogJson[0].EPRICE,
                        "ExitPrice": exitPrice !== 0 ? exitPrice : jsondata[0].PRICE,
                        "StopLoss": jsondata[0].SL,
                        "Quantity": quantity
                    };

                    if (records) {

                        if (records.total_trades >= records.trade_per_day) {
                            return res.status(200).json({
                                success: false,
                                message: "Daily Trade Limit Reached."
                            });
                        }

                        await TradeConfig.findByIdAndUpdate(records._id, {
                            total_trades: records.total_trades + 1,
                        });
                    }

                    const exPrice = exitPrice !== 0 ? exitPrice : jsondata[0].PRICE;
                    await addUpdateTrade(jsondata[0], quantity, exPrice, tradelog.trade_id);
                    tradeId = tradelog.trade_id;
                }
                else {
                    tradeId = await addUpdateTrade(jsondata[0], quantity);
                }

                const requestJson = request == null ? jsondata : request;

                const newLog = new TradeLogs({
                    trade_id: tradeId,
                    unique_id: UniqueId,
                    type: request == null ? jsondata[0].TT : `EXIT ${tradelogJson[0].TT}`,
                    request: JSON.stringify(requestJson),
                    response: JSON.stringify({ "success": true, "message": "Saved." }),
                    alert_at: alertTime
                });

                log = await newLog.save();

                if (request) {
                    await processTrade(requestJson, log._id);
                }

                return res.status(200).json({
                    success: true,
                    message: "Success."
                });
            }
        }

        return res.status(200).json({
            success: false,
            message: "Invalid Request."
        });

    } catch (error) {
        console.log(error);
    }
};

/* Inserting/Updating TradeDetails */
export const handleTradeSettings = async (req, res) => {
    try {
        const { quantity = null, trade_per_day = 3, target1 = null, target2 = null, target3 = null, risk_per_day = null, risk_per_trade = null } = req.body;

        const records = await TradeSettings.findOne();

        if (records) {
            await TradeSettings.findByIdAndUpdate(records._id, {
                quantity: quantity,
                target_1: target1,
                target_2: target2,
                target_3: target3,
                trade_per_day: trade_per_day,
                risk_per_day: risk_per_day,
                risk_per_trade: risk_per_trade,
            });
        }
        else {
            const tradeSettings = new TradeSettings({
                quantity: quantity,
                target_1: target1,
                target_2: target2,
                target_3: target3,
                trade_per_day: trade_per_day,
                risk_per_day: risk_per_day,
                risk_per_trade: risk_per_trade,
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

const getAdjustedRiskQantity = async (jsondata, quantity, risk_per_trade, risk_per_day) => {
    
    let adjustedQuantity = quantity;
    let qTraded = jsondata.EPRICE * quantity;

    let action = jsondata.TT;
    const total_risk = Math.abs(Number(action == 'BUY' ? (qTraded - (jsondata.SL * quantity)) : ((jsondata.SL * quantity) - qTraded))).toFixed(2);

    if(total_risk <= risk_per_trade) {
        return adjustedQuantity;
    }

    for (adjustedQuantity; adjustedQuantity >= 0; adjustedQuantity--) {
        qTraded = Number(jsondata.EPRICE * adjustedQuantity).toFixed(2);
        const risk = Math.abs(Number(action == 'BUY' ? (qTraded - (jsondata.SL * adjustedQuantity)) : ((jsondata.SL * adjustedQuantity) - qTraded))).toFixed(2);

        if(risk <= risk_per_trade) {
            return adjustedQuantity;
        }
    }
}

const addUpdateTrade = async (jsondata, quantity, exitPrice, trade_id) => {

    if (jsondata.EXIT == false) {

        const UniqueId = Date.now();

        const qTraded = jsondata.EPRICE * quantity;

        const action = jsondata.TT;
        const stoploss = Number(jsondata.TT == "BUY" ? ((jsondata.SL * quantity) - qTraded) : (qTraded - (jsondata.SL * quantity))).toFixed(2);

        const trades = new Trades({
            trade_id: UniqueId,
            action: action,
            stoploss: stoploss,
            quantity: quantity,
        });

        const trade = await trades.save();
        return trade.trade_id;
    }
    else {
        const qTraded = jsondata.EPRICE * quantity;
        const action = jsondata.TT;
        const pnl = Number(action == 'BUY' ? ((exitPrice * quantity) - qTraded) : (qTraded - (exitPrice * quantity))).toFixed(2);
        const status = Math.sign(pnl) == 1 ? "PROFIT" : "LOSS";

        await Trades.findOneAndUpdate(
            { trade_id },
            { pnl: pnl, status: status }
        );
    }
}

const getCalculatedAvgPrice = async (request, quantity) => {

    let settings = await TradeSettings.findOne();
    const qTraded = request[0]?.EPRICE * quantity;

    const target1 = request[0]?.TP1 != '0' ? (request[0]?.TT == "BUY" ? (request[0]?.TP1 * quantity - qTraded) * settings.target_1 / 100 : (qTraded - request[0]?.TP1 * quantity) * settings.target_1 / 100) : 0;
    const target2 = request[0]?.TP2 != '0' ? (request[0]?.TT == "BUY" ? (request[0]?.TP2 * quantity - qTraded) * settings.target_2 / 100 : (qTraded - request[0]?.TP2 * quantity) * settings.target_2 / 100) : 0;
    const target3 = request[0]?.TP3 != '0' ? (request[0]?.TT == "BUY" ? (request[0]?.TP3 * quantity - qTraded) * settings.target_3 / 100 : (qTraded - request[0]?.TP3 * quantity) * settings.target_3 / 100) : 0;

    if (target1 == '0' && target2 == '0' && target3 == '0') return 0;

    const totalRevenue = request[0]?.TT == "SELL" ? (qTraded - (target1 + target2 + target3)) : ((target1 + target2 + target3) + qTraded);
    let totalQSold = (request[0]?.TP1 ? (quantity * settings.target_1 / 100) : 0) + (request[0]?.TP2 ? (quantity * settings.target_2 / 100) : 0) + (request[0]?.TP3 ? (quantity * settings.target_3 / 100) : 0);

    if (request[0]?.EXIT == true) {
        totalQSold += quantity - totalQSold != 0 ? quantity - totalQSold : 0;
    }
    const averagePrice = Math.abs(totalRevenue / totalQSold);

    const decimalNo = countDecimalPlaces(request[0]?.EPRICE);
    return averagePrice == request[0]?.EPRICE ? 0 : parseFloat(averagePrice.toFixed(decimalNo));
}

const processTrade = async (requestJson, id) => {
    try {

        const server = await axios.get("https://tradex.onrender.com", undefined, { timeout: 120000 });

        if (server?.status == 200) {
            const response = await axios.post(process.env.TRADE_URL, requestJson, { timeout: 120000 });

            await TradeLogs.findByIdAndUpdate(id, {
                response: JSON.stringify(response.data ?? ""),
                status_code: response?.status,
                status: true
            });
        }
    }
    catch (error) {
        console.log(error);
    }
}

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
                trade_per_day: trade_per_day,
                created_date: getISTISOString()
            });
            await newconfig.save();
        }

        return true;

    } catch (error) {
        return false;
    }
};

export const deleteData = async (req, res) => {
    const { isDelete } = req.body;

    if (isDelete) {
        await TradeSettings.deleteMany();
        await TradeConfig.deleteMany();
        await TradeLogs.deleteMany();
        await Trades.deleteMany();

        return res.status(200).json({
            success: true,
            message: "Success."
        });
    }
}

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
                created_date: {
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
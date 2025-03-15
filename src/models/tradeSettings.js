import mongoose from "mongoose";

const TradeSettingsSechma = new mongoose.Schema(
    {
        quantity: {
            type: Number,
            default: null
        },
        target_1: {
            type: Number,
            default: null
        },
        target_2: {
            type: Number,
            default: null
        },
        target_3: {
            type: Number,
            default: null
        },
        trade_per_day: {
            type: Number,
            default: null
        },
        risk_per_trade: {
            type: String,
            default: null
        },
        risk_per_day: {
            type: String,
            default: null
        },
    },
    { timestamps: true }
);

const TradeSettings = mongoose.model('TradeSettings', TradeSettingsSechma, 'TradeSettings');
export default TradeSettings;
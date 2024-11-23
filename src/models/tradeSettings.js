import mongoose from "mongoose";

const TradeSettingsSechma = new mongoose.Schema(
    {
        quantity: {
            type: Number,
            default: null
        },
        trade_per_day: {
            type: Number,
            default: null
        },
    },
    { timestamps: true }
);

const TradeSettings = mongoose.model('TradeSettings', TradeSettingsSechma, 'TradeSettings');
export default TradeSettings;
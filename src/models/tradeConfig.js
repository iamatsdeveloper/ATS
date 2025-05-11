import mongoose from "mongoose";

const TradeConfigSechma = new mongoose.Schema(
    {
        unique_id: {
            type: Number,
            required: true,
            unique: true,
        },
        total_trades: {
            type: Number,
            default: 0,
        },
        quantity: {
            type: Number,
            default: null
        },
        trade_per_day: {
            type: Number,
            default: null
        },
        created_date: {
            type: Date,
            default: null
        },
    },
    { timestamps: true }
);

const TradeConfig = mongoose.model('TradeConfig', TradeConfigSechma, 'TradeConfig');
export default TradeConfig;
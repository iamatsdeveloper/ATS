import mongoose from "mongoose";

const TradeSechma = new mongoose.Schema(
    {
        trade_id: {
            type: Number,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            default: "-"
        },
        action: {
            type: String,
            default: "-"
        },
        stoploss: {
            type: String,
            default: "-"
        },
        pnl: {
            type: String,
            default: "-"
        },
        quantity: {
            type: String,
            default: "-"
        },
    },
    { timestamps: true }
);

const Trades = mongoose.model('Trades', TradeSechma, 'Trades');
export default Trades;
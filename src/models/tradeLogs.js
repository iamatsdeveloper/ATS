import mongoose from "mongoose";

const TradeLogsSechma = new mongoose.Schema(
    {
        unique_id: {
            type: Number,
            required: true,
            unique: true,
        },
        type: {
            type: String,
            required: true,
        },
        request: {
            type: String,
            default: null
        },
        response: {
            type: String, 
            default: null
        },
        status_code: {
            type: String,
            default: null
        },
        status: {
            type: Boolean,
            default: false
        },
        time_taken: {
            type: String,
            default: null
        },
        alert_at: {
            type: Date,
            default: null
        },
    },
    { timestamps: true }
);

const TradeLogs = mongoose.model('TradeLogs', TradeLogsSechma, 'TradeLogs');
export default TradeLogs;
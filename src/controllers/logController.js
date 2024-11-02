
import TradeLogs from "../models/tradeLogs.js";

/* Fetching logs */
export const fetchLogs = async (req, res) => {
    try {
        const data = await TradeLogs.find().select('-_id unique_id type request response status_code status alert_at createdAt');

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
import fs from "fs";
import path from "path";

class LogHelper {
    constructor() {
        this.datetime = new Date().toLocaleDateString().replaceAll(`/`, '-');
        this.logFilePath = path.join("logs/", `${this.datetime.toString()}_app.log`);
    }

    handleLog(message) {
        const currentDate = getDateTime(); // Get current date and time in ISO format
        const logEntry = `${currentDate} - ${message}\n`;

        // Append the log entry to the log file
        fs.appendFile(this.logFilePath, logEntry);
    }

    getDateTime = () => {
        const d = new Date();
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' };
        return d.toLocaleString('en-US', options).replace(',', '');
    }
}

export default LogHelper;
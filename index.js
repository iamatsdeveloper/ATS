import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import commonroutes from "./src/routes/commonroutes.js";

//#region CONFIGURATIONS
dotenv.config();
const app = express();
const PORT = process.env.PORT || 6000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.json());
app.use(express.static('public'));
app.use('/logs', express.static('logs'))
//#endregion

//#region Routes
app.use("/api", commonroutes);
//#endregion

//#region MONGOOSE SETUP
mongoose.connect(process.env.MONGO_LOCAL_URL, {
    dbName: process.env.DATABASE_NAME
}).then(() => {
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));
}).catch((error) => console.log(`${error} did not connect`));
//#endregion
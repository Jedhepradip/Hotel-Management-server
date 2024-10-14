import express from 'express';
import "dotenv/config"
import chalk from "chalk"
import Indexrouter from "./Router/index.js"
import Paymentrouter from "./Router/Payment.js"
import bodyParser from 'body-parser';
import cors from "cors"
import db from './db/db.js';
import cookieParser from 'cookie-parser';
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())

app.use(express.static("uploads"))
app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use("/", Indexrouter)
app.use("/Payment", Paymentrouter)

app.listen(PORT, () => {
    console.log(chalk.green.bold(`Server running on http://localhost:${PORT}\n`));
});

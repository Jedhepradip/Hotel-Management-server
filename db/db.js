import mongoose from "mongoose";
import chalk from "chalk";
const db_url = process.env.MONGOURL;
const db = await mongoose.connect(db_url)
.then(()=>{
    console.log(chalk.green.bold("\n\nDatabase Connection Successful "));
})
.catch(err=>{
    console.log(err);
})


export default db

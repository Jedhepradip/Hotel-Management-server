import mongoose from "mongoose";
import chalk from "chalk";
const db = await mongoose.connect("mongodb://localhost:27017/HotelManagement")
.then(()=>{
    console.log(chalk.green.bold("\n\nDatabase Connection Successful "));
})
.catch(err=>{
    console.log(err);
})

export default db
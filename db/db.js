import mongoose from "mongoose";
import chalk from "chalk";
const db = await mongoose.connect("mongodb+srv://pradipjedhe69:pradip@cluster0.mck8iyd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/test")
.then(()=>{
    console.log(chalk.green.bold("\n\nDatabase Connection Successful "));
})
.catch(err=>{
    console.log(err);
})

export default db

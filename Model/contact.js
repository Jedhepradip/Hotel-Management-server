import mongoose, { Schema } from "mongoose";

const contactdata = new Schema({
    Name:{
        type:String, 
        required:true,       
    },
    Phone:{
        type:Number,
        required:true,
    },
    Subject:{
        type:String,
        required:true
    },
    Message:{
        type:String,
        required:true
    }
})

export default mongoose.model("contactData",contactdata)    
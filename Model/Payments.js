import mongoose from "mongoose";

const PayemntSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    amount: {
        type: String,
        required: true
    },  
    userId:{
        type:String,
        required:true
    } ,
    RoomsId:{
        type:String,
        required:true
    },
    data: {
        type: Date,
        default: Date.now
    }
})

export default mongoose.model("Payments", PayemntSchema)
import mongoose from "mongoose";

const PayemntSchema = new mongoose.Schema({
    razorpay_order_id: {
        type: String,
        required: true
    },
    razorpay_payment_id: {
        type: String,
        required: true
    },
    razorpay_signature: {
        type: String,
        required: true
    },
    data: {
        type: Date,
        default:Date.now
    }
})

export default mongoose.model("Payments", PayemntSchema)
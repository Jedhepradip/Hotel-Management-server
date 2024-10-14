import mongoose, { Schema } from "mongoose";

const RoomsSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    description: {
        type: String,
    },
    price: {
        type: Number,
    },
    discountPercentage: {
        type: Number,
    },
    discountPrice: {
        type: Number,
    },
    location: {
        type: String,
    },
    thumbnail: {
        type: String,
    },
    images: [{
        imgUrl: String
    }],
    country: {
        type: String,
    },
    likes: [{
        like: {
            type: Schema.Types.ObjectId,
            ref: 'UserModel'
        }
    }],
    Booked: {
        type: Boolean,
        default: false
    },
    UserPayment: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserModel' }],
}, {
    timestamps: true // Correct placement of timestamps
});

export default mongoose.model("Rooms", RoomsSchema);

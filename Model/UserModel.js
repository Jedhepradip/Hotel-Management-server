import mongoose from "mongoose"

const UserModelData = new mongoose.Schema({
    ProfileImg: {
        type: String,
    },
    name: {
        type: String,
        required: true, // This will enforce that 'name' cannot be null
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    mobile: {
        type: Number,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: String,
        default: false
    },
    Rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Rooms' }],
    AddToCardRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Rooms" }],
    PaymentRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Rooms" }],

    Orders: {
        CardNumber: {
            type: Number,
        },
        CARDEXPIRY: {
            type: Date,
        },
        CARDCVC: {
            type: Number,
        },
        CARDHOLDERNAME: {
            type: String,
        },
        Rooms: []
    }
})

export default mongoose.model("UserModel", UserModelData)
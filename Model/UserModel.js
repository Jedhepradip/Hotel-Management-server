import mongoose, { Schema } from "mongoose";

const UserModelData = new mongoose.Schema({
    ProfileImg: {
        type: String,
    },
    name: {
        type: String,
    },
    email: {
        type: String,
        require: true,
        unique: true,
    },
    mobile: {
        type: Number,
        unique: true,
        require: true,
    },
    password: {
        type: String,
        require: true,
    },
    isAdmin: {
        type: String,
        default: false
    },
    Rooms: [{ type: Schema.Types.ObjectId, ref: 'Rooms' }],
    AddToCardRooms: [{ type: Schema.Types.ObjectId, ref: "Rooms" }],
    Orders: {
        CardNumber: {
            type: Number,
            require: true,
        },
        CARDEXPIRY: {
            type: Date,
            require: true,
        },
        CARDCVC: {
            type: Number,
            require: true,
        },
        CARDHOLDERNAME: {
            type: String,
            require: true,
        },
        Rooms: []
    }

})

export default mongoose.model("UserModel", UserModelData)
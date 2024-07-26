import mongoose, { Schema } from "mongoose";

const UserModelData = new mongoose.Schema({
    ProfilImg: {
        type: String,
    },
    Name: {
        type: String,
        require: true,
        unique: true,
    },
    Phone: {
        type: Number,
        unique: true,
        require: true,
    },
    Password: {
        type: String,
        require: true,
    },
    // Rooms: [{ type: Schema.Types.ObjectId, ref: 'Rooms' }],
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
        Rooms:[]
    }

})

export default mongoose.model("UserModel", UserModelData)
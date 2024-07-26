import express from "express"
import multer from "multer"
import RoomsData from "../Model/RoomsData.js"
import UserModel from "../Model/UserModel.js"
import { jwtAuthMiddleware } from "../Middlewares/jwtAuthMiddleware.js"
import { generateToken } from "../Middlewares/generateToken.js"
import bcrypt, { hash } from "bcrypt"
import cookieParser from "cookie-parser"
import contact from "../Model/contact.js"
const router = express.Router()
router.use(cookieParser())

const storage = multer.diskStorage({
    destination: function (req, file, cd) {
        cd(null, 'uploads/')
    },
    filename: function (req, file, cd) {
        cd(null, file.originalname);
    }
})
const upload = multer({ storage: storage });

//to check the server ranning
router.get("/", (req, res) => {
    res.send("Hello World")
})
// User Registration
router.post("/User/Registration", upload.single('Img'), async (req, res) => {
    try {
        const { Name, Phone, Password } = req.body;
        console.log(req.body);
        if (!Name, !Phone, !Password) {
            return res.status(400).json({ Massage: "All Filed Is The Required..!" })
        }

        const NumberCheck = await UserModel.findOne({ Phone: Phone })
        const NameCheck = await UserModel.findOne({ Name: Name })

        if (NumberCheck) {
            return res.status(400).json({ Massage: "Phone Number Is All Ready Exist...!" })
        }

        if (NameCheck) {
            return res.status(400).json({ Massage: "User Name All Ready Exist ...!" })
        }

        const PasswordHeas = await bcrypt.hash(Password, 11)
        const UserData = new UserModel({
            ProfilImg: req.file.originalname,
            Name: Name,
            Phone: Phone,
            Password: PasswordHeas,
        })
        await UserData.save()

        const payload = {
            id: UserData._id,
            Name: UserData.Name
        }

        const token = generateToken(payload)

        console.log("token", token);
        res.cookie("token", token)
        return res.status(200).json({ Massage: "Registration Successful...", token: token })

    } catch (error) {
        console.log("Internal Server Error :", error);
        return res.status(500).json({ Massage: "Internal Server Error pradip" ,error})
    }
})
// To Login User 
router.post("/User/Login", async (req, res) => {
    try {
        const { Password, Phone } = req.body;
        console.log(req.body);

        if (!Password, !Phone) {
            return res.status(400).json({ Message: "All Filed Is Required...!" })
        }

        const NumberCheck = await UserModel.findOne({ Phone });

        if (!NumberCheck) {
            return res.status(400).json({ Message: "Incorrect number or phone...!" }); // Corrected typo
        }

        const PasswordMatch = await bcrypt.compare(Password, NumberCheck.Password); // Corrected typo

        if (!PasswordMatch) {
            return res.status(400).json({ Message: "Incorrect Password...!" });
        }

        const payload = {
            id: NumberCheck._id,
            Name: NumberCheck.Name
        };
        const token = generateToken(payload);
        console.log("token", token);
        res.status(200).json({ Message: "Login Successful...", token }); // Corrected typo

    } catch (error) {
        console.log(error);
        res.status(500).json({ Message: "Internal Server Error" }); // Corrected typo
    }
});

// show Profile Data To fronted
router.get("/Profile/User/Data", jwtAuthMiddleware, async (req, res) => {
    try {
        const userid = req.user.id

        const user = await UserModel.findById(userid)

        let Roomsid = user.Orders.Rooms

        let RoomstobookingUser = [];
        for (let index = 0; index < Roomsid.length; index++) {
            let result = await RoomsData.findById(Roomsid[index].roomsid)
            RoomstobookingUser.push(result)
        }

        res.status(200).json({user:user,RoomstobookingUser:RoomstobookingUser})
        // res.status(200).json(user)
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" })
    }
})

// User Profile Eidit
router.put("/Eidit/User/Profile", jwtAuthMiddleware, upload.single('Img'), async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ msg: "user not found" });
        const dataToUpdate = req.body;

        let phone = dataToUpdate.Phone == user.Phone
        if (!phone) {
            let numberfind = await UserModel.findOne({ Phone: dataToUpdate.Phone })
            let numbers = numberfind == null
            if (!numbers) {
                return res.status(400).json({ msg: "this phoneNumber is already exits" })
            }
        }

        let UserName = await UserModel.findOne({ Name: dataToUpdate.Name })
        if (UserName) {
            if (UserName.Name === user.Name) {
            } else {
                return res.status(400).json({ Message: "UserName All Ready Exsit" })
            }
        }

        if (dataToUpdate.Password) {
            try {
                const saltRounds = 11;
                const hashedPassword = await bcrypt.hash(dataToUpdate.Password, saltRounds);
                dataToUpdate.Password = hashedPassword;
                console.log("Password converted to hash.");
            } catch (error) {
                console.error("Error hashing the password:", error);
            }
        } else {
            dataToUpdate.Password = user.Password;
            console.log("Password not converted to hash.");
        }

        const updatedUser = await UserModel.findByIdAndUpdate(userId, dataToUpdate, { new: true })
        console.log("updatedUser ", updatedUser);
        res.status(200).json({ updatedUser })

    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "internal server error" });
    }
})

// To Add The Rooms Data In Database 
router.post("/rooms/data/owner", async (req, res) => {
    try {
        const { title, description, price, DiscountPercentage, DiscountPrice, location, thumbnail, images, country } = req.body;

        const newRoom = new RoomsData({
            title: title,
            description: description,
            price: price,
            discountPercentage: DiscountPercentage,
            discountPrice: DiscountPrice,
            location: location,
            thumbnail: thumbnail,
            images: images.map(element =>
                ({ imgUrl: element })
            ),
            country: country,
        });
        await newRoom.save();
        res.status(200).json({ newRoom: newRoom });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// To send The Rooms Data In The Frontend 
router.get("/Product/data", async (req, res) => {
    try {
        const Product = await RoomsData.find()
        if (!Product) res.status(400).json({ message: "Product Is Not Found " })
        res.status(200).json({ Product: Product })
    } catch (error) {
        console.log(error);
        res.status(501).json({ message: "Internal Server Error" })
    }
})

// to Pay Ammount
router.put("/User/Rooms/Payments/:RoomsId", jwtAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.id
        const roomsid = req.params.RoomsId

        const { CardNumber, CARDEXPIRY, CARDCVC, CARDHOLDERNAME } = req.body

        if (!CardNumber || !CARDEXPIRY || !CARDCVC || !CARDHOLDERNAME) {
            return res.status(400).json({ Message: "All payment details are required" })
        }

        const User = await UserModel.findById(userId)
        console.log(User);
        if (!User) {
            return res.status(400).json({ Massage: "User Not Found" })
        }

        const Roomsindfo = await RoomsData.findById(roomsid)

        if (!Roomsindfo) {
            return res.status(400).json({ Massage: "Rooms Not Found" })
        }

        User.Orders.Rooms.push({ roomsid, CardNumber, CARDEXPIRY, CARDCVC, CARDHOLDERNAME, })

        // let Roomsfind = User.Orders.default

        await User.save()

        console.log(User);

        return res.status(200).json({ Massage: "Payment details added successfully" })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ Massage: "Internal Server Error" })
    }
})

//to send the data to the Frontend
// router.get("/Patments/Rooms/data", jwtAuthMiddleware, async (req, res) => {
//     try {
//         const UserId = req.user.id
//         const user = await UserModel.findById(UserId)
//         const FindRoomd = await RoomsData.find()
//         let Roomsid = user.Orders.default

//         let RoomstobookingUser = [];
//         for (let index = 0; index < Roomsid.length; index++) {
//             let result = await RoomsData.findById(Roomsid[index].roomsid)
//             RoomstobookingUser.push(result)
//         }

//         return res.status(200).json(RoomstobookingUser)
//     } catch (error) {
//         console.log(error);
//         return res.send(500).json({ Massage: "Internal Server Error" })
//     }
// })

//Remove Rooms To Add To Card
router.put("/Rooms/Removeto/AddtoCard/:removeroomsId", jwtAuthMiddleware, async (req, res) => {
    try {
        const UserId = req.user.id;
        const RoomsId = req.params.removeroomsId;

        // Find the user by ID
        let user = await UserModel.findById(UserId);

        if (!user) {
            return res.status(404).json({ Message: "User not found" });
        }

        // Filter out the room ID from user's Orders.default array
        user.Orders.Rooms = user.Orders.Rooms.filter(id => id.roomsid !== RoomsId);

        // Save the updated user document
        let updatedUser = await user.save();

        // Respond with the updated user (optional)
        res.json(updatedUser);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ Message: "Internal Server Error" });
    }
});

// Like The Rooms 
router.get("/Rooms/User/Like/:RoomsId", jwtAuthMiddleware, async (req, res) => {
    try {
        const UserId = req.user.id
        const RoomsId = req.params.RoomsId;
        const Rooms = await RoomsData.findById(RoomsId)
        const User = await UserModel.findById(UserId)

        if (!Rooms) {
            return res.status(400).json({ Message: "Rooms Not Found" })
        }
        const likess = Rooms.likes.some(like => like.like.toHexString() == UserId)

        if (likess) {
            Rooms.likes = Rooms.likes.filter(like => like.like.toHexString() !== UserId)
        } else {
            Rooms.likes.push({ like: UserId })
        }
        await Rooms.save()
        Rooms.likes.map(like => like.like.toHexString());
        const Roomsall = await RoomsData.find()
        return res.status(200).json({ Roomsall: Roomsall, Rooms: Rooms });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ Message: "Internal Server Error" })
    }
})

//contact 
router.post("/User/Contact", async (req, res) => {
    try {
        const { Name, Phone, Subject, Message } = req.body
        console.log(req.body);
        if (!Name || !Phone || !Subject || !Message) {
            return res.status(400).json({ Message: "All Fild Is Required..." })
        }
        const ContactData = new contact({
            Name,
            Phone,
            Subject,
            Message
        })
        await ContactData.save()
        console.log(ContactData);
        return res.status(200).json({ Message: "Data Save Successful..." })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ Message: "Internal Server Error " })
    }
})

// Forgot Password to User
router.post("/User/ForgotPassword", async (req, res) => {
    try {
        const { Phone } = req.body
        if (!Phone) {
            return res.status(400).json({ message: "Filed Is Required" })
        }

        const User = await UserModel.findOne(Phone)

        if (!User) {
            return res.status(401).json({ Message: "User Not Found" })
        }
        return res.status(200).json(User._id)
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

//Create New Password to the login
router.post("Createpassword/:UserId", async (req, res) => {
    try {
        const UserIs = req.params.UserId
        const { Password, CPassword } = req.body
        if (!Password || !CPassword) {
            return res.status(400).json({ Message: "All Filed Is Required..." })
        }
        if (Password == CPassword) {
            const PasswordHash = await bcrypt.hash(Password, 11)
            const User = await UserModel.findByIdAndUpdate(UserIs, { Password: PasswordHash }, { new: true }).select("Password")
            return res.status(200).json({ Massage: "Password Updata Successfully", User })
        }
        return res.status(400).json({ message: "Password Dont Mach..." })
    } catch (error) {
        console.log(error);
    }
})

export default router

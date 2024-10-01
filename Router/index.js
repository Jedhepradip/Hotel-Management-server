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
router.post("/User/Registration", upload.single('ProfileImg'), async (req, res) => {
    try {
        const { name, email, mobile, password } = req.body

        if (!req.file) {
            return res.status(400).json({ message: "Profile Img Not Found" });
        }

        if (!name || !email || !mobile || !password || !role) {
            return res.status(400).json({ message: "Something is missing..." })
        }

        const Emailexists = await UserData.findOne({ email: email })
        if (Emailexists) {
            return res.status(400).json({ message: "User already exist with this email..." })
        }

        const mobileexist = await UserData.findOne({ mobile: mobile })
        if (mobileexist) {
            return res.status(400).json({ message: "User already exist with this mobile number..." })
        }

        console.log(!(email == "pradipjedhe69@gmail.com"));

        if (role == "recruiter") {
            if (!(email == "pradipjedhe69@gmail.com")) {
                return res.status(400).json({ message: "Only Administrators Can Register For This Role" });
            }
        }

        const haspassword = await bcrypt.hash(password, 11)
        const User = new UserData({
            ProfileImg: req.file?.originalname,
            name,
            email,
            mobile,
            password: haspassword,
            role,
        })

        await User.save()
        const payload = {
            id: User.id,
            email: User.email,
            name: User.name,
        };
        const token = generateToken(payload)
        return res.status(200).json({ message: "Registration Successful..", token, User })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server Error" })
    }
})
// To Login User 
router.post("/User/Login", async (req, res) => {
    try {
        const { email, password, role } = req.body;
        let Useremail = await UserData.findOne({ email })

        if (!Useremail) {
            return res.status(404).json({ message: "User not Found..." })
        }

        let machpassword = await bcrypt.compare(password, Useremail.password)

        if (!machpassword) return res.status(400).json({ message: "Incorrect Password try again..." })

        if (role !== Useremail?.role) return res.status(400).json({ message: "Account doesn't exist with current role..." })

        const payload = {
            id: Useremail._id,
            email: Useremail.email,
            name: Useremail.name,
        }

        const token = generateToken(payload)
        return res.status(200).json({ message: "User login successfully...", token })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error..." })
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

        res.status(200).json({ user: user, RoomstobookingUser: RoomstobookingUser })
        // res.status(200).json(user)
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" })
    }
})

// User Profile Eidit
router.put("/Eidit/User/Profile", jwtAuthMiddleware, upload.single('ProfileImg'), async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ Message: "user not found" });
        const dataToUpdate = req.body;
        const { name, email, mobile, password, } = req.body;

        if (email) {
            const EmailCheck = await UserData.findOne({ email })
            if (EmailCheck) {
                if (!(EmailCheck.email == user.email)) {
                    return res.status(400).json({ message: "Email already exists" });
                }
            }
        }

        if (mobile) {
            const MobileCheck = await UserData.findOne({ mobile })
            if (MobileCheck) {
                if (!(MobileCheck.mobile == user.mobile)) {
                    return res.status(400).json({ message: "Mobile Number already exists" });
                }
            }
        }

        if (dataToUpdate.password) {
            try {
                const saltRounds = 11;
                const hashedPassword = await bcrypt.hash(dataToUpdate.password, saltRounds);
                dataToUpdate.password = hashedPassword;
            } catch (error) {
                console.error(error);
            }
        } else {
            dataToUpdate.password = user.password;
        }

        if (req.file) {
            user.ProfileImg = req.file.originalname
            user.save()
        } else {
            user.ProfileImg = user.ProfilImg
        }

        const updatedUser = await UserModel.findByIdAndUpdate(userId, dataToUpdate, { new: true })
        res.status(200).json({ updatedUser })

    } catch (error) {
        console.log(error);
        res.status(500).json({ Message: "internal server error" });
    }
})

// To Add The Rooms Data In Database 
// router.post("/rooms/data/owner", async (req, res) => {
//     try {
//         // Expecting an array of rooms in the request body      
//         const { title, description, price, DiscountPercentage, DiscountPrice, location, thumbnail, images, country } = req.body;
//         console.log(req.body);


//         // if (!title || !description || !price || !DiscountPercentage || !DiscountPrice || !location || !thumbnail || !images || !country) {
//         //     return res.status(400).json({ message: "all Filed is Required" })
//         // }

//         console.log(req.body);

//         // Map over the array and create new room objects
//         const newRooms = new RoomsData({
//             title: title,
//             description: description,
//             price: price,
//             discountPercentage: DiscountPercentage,
//             discountPrice: DiscountPrice,
//             location: location,
//             thumbnail: thumbnail,
//             images: images.map(image => ({ imgUrl: image })),
//             country: country,
//         });

//         // Use the insertMany method to bulk insert the rooms
//         const insertedRooms = await RoomsData.insertMany(newRooms);

//         console.log(insertedRooms);


//         res.status(200).json({ newRooms: insertedRooms });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

router.post("/rooms/data/owner", async (req, res) => {
    try {
        // Expecting an array of rooms in the request body      
        const { title, description, price, DiscountPercentage, DiscountPrice, location, thumbnail, images, country } = req.body;

        console.log(req.body);

        // Validate required fields
        // if (!title || !description || !price || !DiscountPercentage || !DiscountPrice || !location || !thumbnail || !images || !country) {
        //     return res.status(400).json({ message: "All fields are required" });
        // }

        // // Check if 'images' is an array before attempting to map
        // if (!Array.isArray(images)) {
        //     return res.status(400).json({ message: "'images' must be an array" });
        // }

        // Create a new room object
        const newRooms = new RoomsData({
            title: title,
            description: description,
            price: price,
            discountPercentage: DiscountPercentage,
            discountPrice: DiscountPrice,
            location: location,
            thumbnail: thumbnail,
            images: images.map(image => ({ imgUrl: image })),  // Mapping over images
            country: country,
        });

        // Insert the new room data
        const insertedRooms = await RoomsData.insertMany(newRooms);

        console.log(insertedRooms);

        // Respond with the inserted room data
        res.status(200).json({ newRooms: insertedRooms });
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
        res.status(200).json(Product)
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

        Roomsindfo.Booked = true
        User.Orders.Rooms.push({ roomsid, CardNumber, CARDEXPIRY, CARDCVC, CARDHOLDERNAME })


        await User.save()
        await Roomsindfo.save()

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
        let Rooms = await RoomsData.findById(RoomsId)

        Rooms.Booked = false

        Rooms.save()
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

        console.log("User likes :", User);

        if (!Rooms) {
            return res.status(400).json({ Message: "Rooms Not Found" })
        }
        const likess = Rooms.likes.some(like => like.like.toHexString() == UserId)

        if (likess) {
            Rooms.likes = Rooms.likes.filter(like => like.like.toHexString() !== UserId)
        } else {
            Rooms.likes.push({ like: UserId })
        }

        let likesinrooms = await Rooms.save()

        console.log("likesinrooms :", likesinrooms);

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
router.post("/User/ForgotPassword/:Phone", async (req, res) => {
    try {

        let Phone = req.params.Phone
        console.log(Phone);
        if (!Phone) {
            return res.status(400).json({ Message: "Filed Is Required" })
        }
        const User = await UserModel.findOne({ Phone: Phone })

        if (!User) {
            return res.status(401).json({ Message: "User Not Found" })
        }
        return res.status(200).json(User._id)
    } catch (error) {
        console.log(error);
        return res.status(500).json({ Message: "Internal Server Error" })
    }
})

//Create New Password to the login
router.post("/Createpassword/:UserId", async (req, res) => {
    try {
        const UserId = req.params.UserId;
        const { Password, CPassword } = req.body;
        console.log("req.body:", req.body);

        if (!Password || !CPassword) {
            return res.status(400).json({ Message: "All Fields Are Required..." });
        }

        if (Password === CPassword) {
            const PasswordHash = await bcrypt.hash(Password, 11);
            const User = await UserModel.findByIdAndUpdate(UserId, { Password: PasswordHash }, { new: true }).select("Password");
            console.log("User:", User);
            return res.status(200).json({ Message: "Password Updated Successfully", User });
        }
        return res.status(400).json({ Message: "Passwords Don't Match..." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ Message: "Server Error" });
    }
});

export default router

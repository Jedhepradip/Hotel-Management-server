import express from "express"
import multer from "multer"
import RoomsData from "../Model/RoomsData.js"
import UserModel from "../Model/UserModel.js"
import { jwtAuthMiddleware } from "../Middlewares/jwtAuthMiddleware.js"
import { generateToken } from "../Middlewares/generateToken.js"
import bcrypt, { hash } from "bcrypt"
import cookieParser from "cookie-parser"
import contact from "../Model/contact.js"
import nodemailer from "nodemailer"
import { use } from "bcrypt/promises.js"
// import razorpay from "razorpay"
// import payments from "razorpay/dist/types/payments.js"
// import Payments from "../Model/Payments.js"

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

// const rezorpayInstance = new razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret: process.env.RAZORPAY_SECRET,
// })

//to check the server ranning
router.get("/", (req, res) => {
    res.send("Hello World")
})

// router.post("/Payments", async (req, res) => {
//     try {
//         const { amounts } = req.body
//         const options = {
//             amounts: Number(amounts * 100),
//             currency: "INR",
//             receipt: crypto.randomBytes(10).toString("hex"),
//         }
//         rezorpayInstance.orders.create(options, (error, order) => {
//             if (error) {
//                 console.log(error);
//                 return res.status(500).json({ message: "Something Went Wrong!" })
//             }
//             console.log(order);
//             return res.status(200).json({ data: order })
//         })
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({ message: "Internal Server error" })
//     }
// })

// router.post('/verify-payment', async (req, res) => {
//     try {
//         const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//         const sign = razorpay_order_id + "|" + razorpay_payment_id
//         const expectedSign = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).upload(sign.toString()).digest("hex")

//         const isAuthentice = expectedSign == razorpay_signature
//         console.log(isAuthentice);
//         if (isAuthentice) {
//             const payment = new Payments({
//                 razorpay_order_id,
//                 razorpay_payment_id,
//                 razorpay_signature,
//             })
//             await payment.save();
//             return res.status(200).json({message:"Payments successfully"})
//         }

//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({ message: "Internal Server Error" })
//     }
// })

// router.post('/UserSendOtp', async (req, res) => {
//     try {
//         const { email, number } = req.body;
//         console.log(req.body);

//         const user = await UserModel.findOne({ email: email });
//         if (user) {
//             return res.status(400).json({ message: "User already exist with this Email..." })
//         }
//         const MobileNum = await UserModel.findOne({ mobile: number })
//         if (MobileNum) {
//             return res.status(400).json({ message: "User already exist with this Number..." })
//         }
//         // Generate a 4-digit OTP
//         const otp = Math.floor(1000 + Math.random() * 9000);

//         // Set up the email transporter
//         const transporter = nodemailer.createTransport({
//             host: 'smtp.gmail.com',
//             secure: true,
//             port: Number(process.env.NODEMAILER_PORT) || 465,
//             auth: {
//                 user: process.env.USER,
//                 pass: process.env.PASS,
//             },
//         });

//         // Send OTP email
//         const info = await transporter.sendMail({
//             from: process.env.FROM,
//             to: email, // Send the email to the user
//             subject: "Sign In Confirmation & OTP Verification", // Subject line
//             text: `Your OTP is ${otp}`, // Fallback text
//             html: `
//                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
//                 <h2 style="color: black; text-aling:center;">Hello Confirmation & OTP Verification </h2>
//                 <p>We noticed a successful sign-in to your account from a new device or location. For your security, we require additional verification before you can continue.</p>
                
//                 <p>Please use the following One-Time Password (OTP) to verify your identity:</p>
//                 <div style="background-color: #f4f4f4; padding: 10px 20px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center; max-width: 200px; margin: auto;">
//                     ${otp}
//                 </div>
                
//                 <p style="margin-top: 20px;">The OTP is valid for the next 10 minutes. If you did not request this verification, please ignore this email or contact our support team immediately.</p>
                
//                 <h3 style="margin-top: 30px; color: #333;">Sign In Details:</h3>
//                 <div style="background-color: #f9f9f9; padding: 10px; border-radius: 5px;">
//                     <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
//                     <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
//                 </div>
                
//                 <p style="margin-top: 30px;">Thank you for using our service. We are committed to keeping your account secure.</p>
                
//                 <p>Best regards, <br/> The Support Team</p>
                
//                 <p style="font-size: 12px; color: #888; margin-top: 20px;">If you did not sign in or request this OTP, please contact us immediately at support@yourcompany.com.</p>
//             </div>
//             `,
//         });
//         return res.status(200).json({ message: "OTP sent successfully Check Your Email... ", otp });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: "Internal Server Error" });
//     }
// })
router.post('/UserSendOtp', async (req, res) => {
    try {
        const { email, number } = req.body;
        console.log(req.body);

        const user = await UserModel.findOne({ email: email });
        if (user) {
            return res.status(400).json({ message: "User already exists with this Email..." });
        }

        const MobileNum = await UserModel.findOne({ mobile: number }); // Ensure consistency with 'number' and 'mobile'
        if (MobileNum) {
            return res.status(400).json({ message: "User already exists with this Number..." });
        }

        // Generate a 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000);

        // Set up the email transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            secure: true,
            port: Number(process.env.NODEMAILER_PORT) || 465,
            auth: {
                user: process.env.USER,
                pass: process.env.PASS,
            },
        });

        // Send OTP email
        const info = await transporter.sendMail({
            from: process.env.FROM,
            to: email, // Send the email to the user
            subject: "Sign In Confirmation & OTP Verification", // Subject line
            text: `Your OTP is ${otp}`, // Fallback text
            html: `
               <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: black; text-align: center;">Hello, Confirmation & OTP Verification</h2>
                <p>We noticed a successful sign-in to your account from a new device or location. For your security, we require additional verification before you can continue.</p>
                
                <p>Please use the following One-Time Password (OTP) to verify your identity:</p>
                <div style="background-color: #f4f4f4; padding: 10px 20px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center; max-width: 200px; margin: auto;">
                    ${otp}
                </div>
                
                <p style="margin-top: 20px;">The OTP is valid for the next 10 minutes. If you did not request this verification, please ignore this email or contact our support team immediately.</p>
                
                <h3 style="margin-top: 30px; color: #333;">Sign In Details:</h3>
                <div style="background-color: #f9f9f9; padding: 10px; border-radius: 5px;">
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
                </div>
                
                <p style="margin-top: 30px;">Thank you for using our service. We are committed to keeping your account secure.</p>
                
                <p>Best regards, <br/> The Support Team</p>
                
                <p style="font-size: 12px; color: #888; margin-top: 20px;">If you did not sign in or request this OTP, please contact us immediately at support@yourcompany.com.</p>
            </div>
            `,
        });
        return res.status(200).json({ message: "OTP sent successfully. Check your email.", otp });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
// User Registration
router.post("/User/Registration", upload.single('ProfileImg'), async (req, res) => {
    try {
        const { name, email, mobile, password } = req.body
        console.log(req.body);

        if (!req.file) {
            return res.status(400).json({ message: "Profile Img Not Found" });
        }

        if (!name || !email || !mobile || !password) {
            return res.status(400).json({ message: "Something is missing..." })
        }

        const Emailexists = await UserModel.findOne({ email: email })
        if (Emailexists) {
            return res.status(400).json({ message: "User already exist with this email..." })
        }

        const mobileexist = await UserModel.findOne({ mobile: mobile })
        if (mobileexist) {
            return res.status(400).json({ message: "User already exist with this mobile number..." })
        }


        const haspassword = await bcrypt.hash(password, 11)
        const UserData = new UserModel({
            ProfileImg: req.file?.originalname,
            name,
            email,
            mobile,
            password: haspassword,
        })

        await UserData.save()
        const payload = {
            id: UserData.id,
            email: UserData.email,
            name: UserData.name,
        };

        const isAdminData = await UserModel.findById(UserData.id);
        if (isAdminData) {
            if (isAdminData.email === "pradipjedhe69@gmail.com") {
                isAdminData.isAdmin = true;
                await isAdminData.save();
            } else {
                isAdminData.isAdmin = false;
                await isAdminData.save();
            }
        }

        const token = generateToken(payload)
        return res.status(200).json({ message: "Registration Successful..", token })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server Error" })
    }
})
// To Login User 
router.post("/User/Login", async (req, res) => {
    try {
        const { email, password } = req.body;
        let Useremail = await UserModel.findOne({ email })
        console.log(req.body);
        if (!Useremail) {
            return res.status(404).json({ message: "User not Found..." })
        }

        let machpassword = await bcrypt.compare(password, Useremail.password)
        if (!machpassword) return res.status(400).json({ message: "Incorrect Password try again..." })

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
        return res.status(200).json({ user, RoomstobookingUser })

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
        const { name, email, mobile } = req.body;
        console.log(req.body);

        if (email) {
            const EmailCheck = await UserModel.findOne({ email })
            if (EmailCheck) {
                if (!(EmailCheck.email == user.email)) {
                    return res.status(400).json({ message: "Email already exists" });
                }
            }
        }

        if (mobile) {
            const MobileCheck = await UserModel.findOne({ mobile })
            if (MobileCheck) {
                if (!(MobileCheck.mobile == user.mobile)) {
                    return res.status(400).json({ message: "Mobile Number already exists" });
                }
            }
        }

        // if (dataToUpdate.password) {
        //     try {
        //         const saltRounds = 11;
        //         const hashedPassword = await bcrypt.hash(dataToUpdate.password, saltRounds);
        //         dataToUpdate.password = hashedPassword;
        //     } catch (error) {
        //         console.error(error);
        //     }
        // } else {
        //     dataToUpdate.password = user.password;
        // }

        if (req.file) {
            user.ProfileImg = req.file.originalname
            user.save()
        } else {
            user.ProfileImg = user.ProfileImg
        }

        const updatedUser = await UserModel.findByIdAndUpdate(userId, dataToUpdate, { new: true })
        res.status(200).json({ updatedUser })

    } catch (error) {
        console.log(error);
        res.status(500).json({ Message: "internal server error" });
    }
})

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

//User Add To Card Rooms 
router.put("/User/AddToCard/:RoomsId", jwtAuthMiddleware, async (req, res) => {
    try {
        const user = await UserModel.findById(req.user.id)
        const Rooms = await RoomsData.findById(req.params.RoomsId)
        if (!user) {
            return res.status(400).json({ message: "User Not Found" })
        }
        if (!Rooms) {
            return res.status(400).json({ message: "Rooms Not Found" })
        }
        const RoomsAllredyExist = user.AddToCardRooms.filter(
            (e) => e._id.toString() == Rooms._id.toString()
        );

        if (RoomsAllredyExist.length > 0) {
            return res.status(400).json({ message: "This room has already been added to your cart!" })
        }

        if (user) {
            user.AddToCardRooms.push(Rooms._id)
            user.save()
        }
        return res.status(200).json({ message: "Rooms Aded To add To Card..." })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" })
    }
})
//Remove Rooms To Add To Card
router.put("/Rooms/Removeto/AddtoCard/:removeroomsId", jwtAuthMiddleware, async (req, res) => {
    try {
        const UserId = req.user.id;
        const RoomsId = req.params.removeroomsId;

        // Find the user by their ID
        let user = await UserModel.findById(UserId);
        if (!user) {
            return res.status(404).json({ Message: "User not found" });
        }

        // Find the room by its ID
        const room = await RoomsData.findById(RoomsId);
        if (!room) {
            return res.status(404).json({ Message: "Room not found" });
        }

        // Filter out the room from AddToCardRooms array
        user.AddToCardRooms = user.AddToCardRooms.filter(
            (e) => e._id.toString() !== room._id.toString()
        );

        // Save the updated user object
        await user.save();

        // Optionally, update room booking status (if needed)
        room.Booked = false;
        await room.save();
        console.log(user);

        // Return the updated user data
        return res.json({ Message: "Room removed successfully", user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ Message: "Internal Server Error" });
    }

});

// Like The Rooms 
router.put("/Rooms/User/Like/:RoomsId", jwtAuthMiddleware, async (req, res) => {
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
            User.Rooms = User.Rooms.filter(like => like.toHexString() !== Rooms._id.toHexString())
        } else {
            Rooms.likes.push({ like: UserId })
            User.Rooms.push(Rooms._id)
        }
        await User.save()
        let likesinrooms = await Rooms.save()

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
router.post("/ForgetPassword", async (req, res) => {
    try {
        const { email } = req.body;
        const EmailCheck = await UserModel.findOne({ email })

        // Generate a 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000);

        // Set up the email transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            secure: true,
            port: Number(process.env.NODEMAILER_PORT) || 465,
            auth: {
                user: process.env.USER,
                pass: process.env.PASS,
            },
        });

        // Send OTP email
        const info = await transporter.sendMail({
            from: process.env.FROM,
            to: email, // Send the email to the user
            subject: "Sign In Confirmation & OTP Verification", // Subject line
            text: `Your OTP is ${otp}`, // Fallback text
            html: `
               <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: black; text-align:center;">Hello Confirmation & OTP Verification </h2>
            <p>We noticed a successful sign-in to your account from a new device or location. For your security, we require additional verification before you can continue.</p>
            <p>Please use the following One-Time Password (OTP) to verify your identity:</p>
            <div style="background-color: #f4f4f4; padding: 10px 20px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center; max-width: 200px; margin: auto;">
                ${otp}
            </div>
            <p style="margin-top: 20px;">The OTP is valid for the next 10 minutes. If you did not request this verification, please ignore this email or contact our support team immediately.</p>
            <h3 style="margin-top: 30px; color: #333;">Sign In Details:</h3>
            <div style="background-color: #f9f9f9; padding: 10px; border-radius: 5px;">
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
            </div>
            <p style="margin-top: 30px;">Thank you for using our service. We are committed to keeping your account secure.</p>
            <p>Best regards, <br/> The Support Team</p>
            <p style="font-size: 12px; color: #888; margin-top: 20px;">If you did not sign in or request this OTP, please contact us immediately at support@yourcompany.com.</p>
        </div>
             `,
        });
        return res.status(200).json({ message: "OTP sent successfully Check Your Email... ", otp, EmailCheck });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ Message: "Internal Server Error" })
    }
})

//Create New Password to the login
router.post("/Createpassword/:id", async (req, res) => {
    try {
        const { Password } = req.body;
        const userId = req.params.id;


        if (!Password) {
            return res.status(400).json({ message: "Password is missing." });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const hashedPassword = await bcrypt.hash(Password, 11);
        const userpasswordupdated = await UserModel.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true })
        user.password = hashedPassword;
        await user.save();
        return res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
        console.error("Error updating password:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router

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
        return res.status(200).json({ user })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" })
    }
})

router.get("/Admin/AllUser/Send", jwtAuthMiddleware, async (req, res) => {
    try {
        const user = req?.user?.id
        const UserData = await UserModel.findById(user)
        if (!UserData) {
            return res.status(400).json({ message: "User Not Found..." })
        }
        const Alluser = await UserModel.find()
        return res.status(200).json(Alluser)
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server Error" })
    }
})

//User Edit to Use Admin or Student
router.put("/Eidit/User/Profile/:id", jwtAuthMiddleware, upload.single('ProfileImg'), async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ Message: "User not found" });

        const { name, email, mobile } = req.body;

        // Check for duplicate email
        if (email) {
            const emailCheck = await UserModel.findOne({ email });
            if (emailCheck && emailCheck._id.toString() !== userId) {
                return res.status(400).json({ message: "Email already exists" });
            }
        }

        // Check for duplicate mobile number
        if (mobile) {
            const mobileCheck = await UserModel.findOne({ mobile });
            if (mobileCheck && mobileCheck._id.toString() !== userId) {
                return res.status(400).json({ message: "Mobile Number already exists" });
            }
        }

        // Update user details
        user.name = name || user.name;
        user.email = email || user.email;
        user.mobile = mobile || user.mobile;

        // Handle profile image upload
        if (req.file) {
            user.ProfileImg = req.file.originalname;
        }

        // if (email) {
        //     const EmailCheck = await UserModel.findOne({ email })
        //     if (EmailCheck) {
        //         if (!(EmailCheck.email == user.email)) {
        //             return res.status(400).json({ message: "Email already exists" });
        //         }
        //     }
        //     await user.save()
        // }

        // if (mobile) {
        //     const MobileCheck = await UserModel.findOne({ mobile })
        //     if (MobileCheck) {
        //         if (!(MobileCheck.mobile == user.mobile)) {
        //             return res.status(400).json({ message: "Mobile Number already exists" });
        //         }
        //     }
        //     await user.save()
        // }

        const updatedUser = await user.save();
        res.status(200).json({ updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ Message: "Internal server error" });
    }
});

//Admin The Delete The User 
router.delete("/Admin/Delete/User/:id", jwtAuthMiddleware, async (req, res) => {
    try {
        const UserId = req.params.id;

        // Check if the user exists
        const user = await UserModel.findById(UserId);
        if (!user) {
            return res.status(404).json({ message: "User Not Found..." }); // Use 404 for not found
        }

        // Delete the user
        const deletedUser = await UserModel.findByIdAndDelete(UserId);
        if (!deletedUser) {
            return res.status(500).json({ message: "Error deleting user." });
        }

        // Optionally return the deleted user data
        return res.status(200).json({ message: "User deleted successfully." });

    } catch (error) {
        console.error(error); // Changed to console.error for better visibility
        return res.status(500).json({ message: "Internal Server Error..." });
    }
});


router.post("/rooms/data/owner", upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'images', maxCount: 10 }]), async (req, res) => {
    try {
        // Expecting an array of rooms in the request body      
        const { title, description, price, DiscountPercentage, DiscountPrice, location, thumbnail, images, country } = req.body;
        console.log(req.body);

        if (!(req.files.thumbnail && req.files.images)) {

            return res.status(400).json({ message: "'images' must be an array" });
        }

        // Validate required fields
        if (!title || !description || !price || !DiscountPercentage || !DiscountPrice || !location || !country) {
            return res.status(400).json({ message: "All fields are required" });
        }
        console.log("thumbnail :", req.files.thumbnail[0].originalname);

        // Create a new room object
        const newRooms = new RoomsData({
            title: title,
            description: description,
            price: price,
            discountPercentage: DiscountPercentage,
            discountPrice: DiscountPrice,
            location: location,
            thumbnail: req?.files?.thumbnail[0]?.originalname,
            images: req.files.images.map(image => ({ imgUrl: image.originalname })),  // Mapping over images
            country: country,
        });
        // Insert the new room data
        const insertedRooms = await RoomsData.insertMany(newRooms);

        // Respond with the inserted room data
        res.status(200).json({ newRooms: insertedRooms });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post("/Admin/Edit/Rooms/:id", upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'images', maxCount: 10 }]), async (req, res) => {
    try {
        const CardId = req.params.id
        const { title, description, price, DiscountPercentage, DiscountPrice, location, country } = req.body;
        const Card = await RoomsData.findById(CardId)
        if (!Card) {
            return res.status(400).json({ message: "Rooms Not Fount..." })
        }
        Card.title = title || Card.title;
        Card.description = description || Card.description;
        Card.price = price || Card.price;
        Card.discountPercentage = DiscountPercentage || Card.discountPercentage;
        Card.discountPrice = DiscountPrice || Card.discountPrice;
        Card.location = location || Card.location;
        Card.country = country || Card.country;
        // Handle profile image upload
        if (req.file.thumbnail) {
            Card.thumbnail = req?.file?.thumbnail[0]?.originalname;
        }
        if (req.file.images) {
            Card.images = req.files.images.map(image => ({ imgUrl: image.originalname })) // Mapping over images
        }

        await Card.save()
        return res.status(200).json({ message: "Card Updated successfully" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" })
    }
})
//Rooms Delete For The Admin
router.delete("/Rooms/Delete/Admin/:id", jwtAuthMiddleware, async (req, res) => {
    try {
        const Card = req?.params?.id
        const Rooms = await RoomsData.findById(Card)
        if (!Rooms) {
            return res.status(400).json({ message: "Rooms Not Found" })
        }
        const deletedCard = await RoomsData.findByIdAndDelete(Card);
        if (!deletedCard) {
            return res.status(500).json({ message: "Error deleting user." });
        }
        return res.status(200).json({ message: "Rooms deleted successfully." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error..." })
    }
})

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
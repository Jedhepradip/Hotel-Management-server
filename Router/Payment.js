import express from 'express';
import Stripe from 'stripe';
import UserModel from '../Model/UserModel.js';
import RoomsData from '../Model/RoomsData.js';
import { jwtAuthMiddleware } from '../Middlewares/jwtAuthMiddleware.js';
import Payments from '../Model/Payments.js';
import nodemailer from "nodemailer"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: '2024-06-20',
});

const router = express.Router();

router.post('/api/create-payment-intent', jwtAuthMiddleware, async (req, res) => {

    const { amount, RoomsId, userName, userEmail } = req.body;
    console.log(req.body);

    try {
        // Create payment intent using Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // Amount in smallest currency unit (e.g., paise)
            currency: 'inr',
            payment_method_types: ['card'],
            metadata: { RoomsId }, // Attach metadata to track which course the payment is for
        });

        // Find the user
        const user = await UserModel.findById(req.user?.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log(RoomsId);
        // Find the room/course by RoomsId
        const Rooms = await RoomsData.findById(RoomsId);
        console.log(Rooms);
        if (!Rooms) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const Payment = new Payments({
            name: userName,
            email: userEmail,
            amount,
            userId: req.user?.id,
            RoomsId
        })
        await Payment.save()
        // Check if user is already enrolled in the room
        const isAlreadyEnrolled = user?.PaymentRooms.includes(RoomsId);

        // if (isAlreadyEnrolled) {
        //     console.log("alredy have payment this rooms ");
        //     return res.status(400).json({ message: 'User already Payment in this room' });
        // }

        // Enroll the user in the room
        user.PaymentRooms.push(RoomsId);
        await user.save();

        // Add the user to room's payment list
        Rooms.UserPayment.push(user.id);
        await Rooms.save();


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
            to: "pradipjedhe69@gmail.com", // Send the email to the user
            subject: "Payment Confirmation", // Update the subject to reflect payment success
            text: `Your payment for ${Rooms.title} was successful. The total amount paid is $${Rooms.discountPrice}.`, // Fallback text
            html: `
               <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: black; text-align: center;">Payment Confirmation</h2>
                    
                    <p>We are happy to confirm that your payment for the product <strong>${Rooms.title}</strong> was successful!</p>
                    
                    <div style="background-color: #f4f4f4; padding: 10px 20px; border-radius: 8px; font-size: 18px; font-weight: bold; text-align: center; max-width: 300px; margin: auto;">
                        Total Paid: $${Rooms.discountPrice}
                    </div>
                    
                    <h3 style="margin-top: 30px; color: #333;">Payment Details:</h3>
                    <div style="background-color: #f9f9f9; padding: 10px; border-radius: 5px;">
                        <p><strong>Product Title:</strong> ${Rooms.title}</p>
                        <p><strong>Total Paid:</strong> $${Rooms.discountPrice}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                        <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
                    </div>
        
                    <p style="margin-top: 30px;">Thank you for your payment and for using our service. If you have any questions or concerns, feel free to contact our support team.</p>
                    
                    <p>Best regards, <br/> The Support Team</p>
                    
                    <p style="font-size: 12px; color: #888; margin-top: 20px;">If you did not make this payment, please contact us immediately at support@yourcompany.com.</p>
                </div>
            `,
        });
        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ message: 'Unable to create payment intent' });
    }
});

export default router;

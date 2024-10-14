import express from 'express';
import Stripe from 'stripe';
import UserModel from '../Model/UserModel.js';
import RoomsData from '../Model/RoomsData.js';
import { jwtAuthMiddleware } from '../Middlewares/jwtAuthMiddleware.js';
import Payments from '../Model/Payments.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: '2024-06-20',
});

const router = express.Router();

router.post('/api/create-payment-intent', jwtAuthMiddleware, async (req, res) => {
    const { amount, courseId, userName, userEmail } = req.body;
    console.log(req.body);

    try {
        // Create payment intent using Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // Amount in smallest currency unit (e.g., paise)
            currency: 'inr',
            payment_method_types: ['card'],
            metadata: { courseId }, // Attach metadata to track which course the payment is for
        });

        // Find the user
        const user = await UserModel.findById(req.user?.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find the room/course by courseId
        const Rooms = await RoomsData.findById(courseId);

        if (!Rooms) {
            return res.status(404).json({ error: 'Room not found' });
        }
        const Payment = new Payments({
            name: userName,
            email: userEmail,
            amount,
        })
        await Payment.save()
        // Check if user is already enrolled in the room
        const isAlreadyEnrolled = user.PaymentRooms.includes(courseId);

        if (isAlreadyEnrolled) {
            return res.status(400).json({ error: 'User already enrolled in this room' });
        }

        // Enroll the user in the room
        user.PaymentRooms.push(courseId);
        await user.save();

        // Add the user to room's payment list
        Rooms.UserPayment.push(user.id);
        await Rooms.save();

        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: 'Unable to create payment intent' });
    }
});

export default router;

import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import connectDB from './configs/db.js'
import userRouter from './routes/userRoutes.js'
import chatRouter from './routes/chatRoutes.js'
import messageRouter from './routes/messageRoutes.js'
import creditRouter from './routes/creditRoutes.js'
import { stripeWebhooks } from './controllers/webhooks.js'

import mongoose from 'mongoose'

const app = express()

app.use(cors({
    origin: '*',
    credentials: true
}))

// Connect to Database asynchronously
connectDB().catch(err => console.error("Initial DB connect error:", err.message))

app.post('/api/stripe', express.raw({type: 'application/json'}), stripeWebhooks)

app.use(express.json())

// Middleware to ensure DB connection is ready on API requests
app.use(async (req, res, next) => {
    if (req.path === '/api/stripe' || req.path === '/') {
        return next()
    }
    try {
        await connectDB()
        next()
    } catch (err) {
        console.error("DB connection error in request:", err.message)
        return res.status(503).json({
            success: false,
            message: "Database connection failed. Please ensure MONGODB_URI is set correctly in Vercel environment variables and MongoDB Atlas allows 0.0.0.0/0."
        })
    }
})

app.get('/', (req, res) => res.send('Server is Live!'))
app.use('/api/user', userRouter)
app.use('/api/chat', chatRouter)
app.use('/api/message', messageRouter)
app.use('/api/credit', creditRouter)

const PORT = process.env.PORT || 3000

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
}

export default app
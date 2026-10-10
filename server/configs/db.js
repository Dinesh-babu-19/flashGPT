import mongoose from "mongoose";
import dns from "dns";

// Fix Node.js DNS SRV resolution ONLY on local Windows environments
if (!process.env.VERCEL && process.platform === "win32") {
    try {
        dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    } catch (e) {
        // Keep default if restricted
    }
}

let cachedPromise = null;

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined in environment variables");
    }

    if (!cachedPromise) {
        const uri = process.env.MONGODB_URI;
        cachedPromise = mongoose.connect(uri, {
            dbName: 'flashgpt',
            serverSelectionTimeoutMS: 8000,
        }).then((mongooseInstance) => {
            console.log('MongoDB connected successfully');
            return mongooseInstance;
        }).catch((err) => {
            cachedPromise = null;
            console.error('MongoDB connection error:', err.message);
            throw err;
        });
    }

    try {
        await cachedPromise;
    } catch (error) {
        cachedPromise = null;
        throw error;
    }

    return mongoose.connection;
};

mongoose.connection.on('connected', () => console.log('MongoDB connection established'));
mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
    cachedPromise = null;
});
mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err.message));

export default connectDB;
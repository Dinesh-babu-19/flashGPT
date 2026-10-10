import mongoose from "mongoose";
import dns from "dns";

// Fix Node.js DNS SRV resolution on Windows / restricted ISPs
try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
    // Keep default if restricted
}

let isConnecting = false;

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (isConnecting) {
        return;
    }

    if (!process.env.MONGODB_URI) {
        console.error("MONGODB_URI is not defined in environment variables");
        return;
    }

    isConnecting = true;

    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri, {
            dbName: 'flashgpt',
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
        });
        console.log('Database connected successfully');
    } catch (error) {
        console.error("Database connection error:", error.message);
    } finally {
        isConnecting = false;
    }
};

mongoose.connection.on('connected', () => console.log('MongoDB connection established'));
mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err.message));

export default connectDB;
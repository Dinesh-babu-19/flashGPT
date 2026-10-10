import jwt from 'jsonwebtoken'
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    let token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ success: false, message: "Not authorized, token missing!" });
    }

    if (token.startsWith('Bearer ')) {
        token = token.slice(7).trim();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const userId = decoded.id;

        const user = await User.findById(userId).select('-password')

        if(!user){
            return res.status(401).json({success: false, message: "Not authorized, user not found!"});
        }

        req.user = user;
        next()
    } catch (error) {
        return res.status(401).json({success: false, message: "Not authorized, token invalid or expired!"})
    }
}
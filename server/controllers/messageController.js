import axios from "axios"
import Chat from "../models/Chat.js"
import User from "../models/User.js"
import imagekit from "../configs/imagekit.js"
import { generateText } from "../configs/gemini.js"


// Text-based AI Chat Message Controller
export const textMessageController = async (req, res) => {
    try {
        // console.table(req.user)
        const userId = req.user._id;
        const { chatId, prompt } = req.body;

        // Validate prompt
        if (!prompt || !prompt.trim()) {
            return res.status(400).json({
                success: false,
                message: "Prompt cannot be empty",
            });
        }

        // Check credits
        if (req.user.credits < 1) {
            return res.status(403).json({
                success: false,
                message: "You don't have enough credits to use this feature!",
            });
        }

        // Find or create chat
        let chat = null;
        if (chatId) {
            try {
                chat = await Chat.findOne({ _id: chatId, userId });
            } catch (err) {
                // Invalid chatId fallback
            }
        }

        if (!chat) {
            chat = await Chat.create({
                userId,
                userName: req.user.name,
                name: prompt.trim().slice(0, 30) || "New Chat",
                messages: []
            });
        }

        // Save user message
        chat.messages.push({
            role: "user",
            content: prompt,
            timestamp: Date.now(),
            isImage: false,
        });

        // Gemini call (free tier, stable models with fallback)
        const { text: replyText } = await generateText(prompt);

        const reply = {
            role: "assistant",
            content: replyText,
            timestamp: Date.now(),
            isImage: false,
        };

        // Save assistant reply
        chat.messages.push(reply);
        await chat.save();

        // Deduct credits
        await User.updateOne(
            { _id: userId },
            { $inc: { credits: -1 } }
        );

        // Respond
        res.json({
            success: true,
            reply,
        });

    } catch (error) {
        console.error("Gemini controller error:", error);
        res.status(error?.status || 500).json({
            success: false,
            message: error?.message || "Internal server error",
        });
    }
};


// Image Generation Message Controller
export const imageMessageController = async (req, res) => {
    try {
        const userId = req.user._id;
        // Check credits
        if(req.user.credits < 2){
            return res.json({success: false, message: "You don't have enough credits to use this feature!"})
        }
        if (req.user.credits <= 0) {
            return res.status(403).json({ message: "No credits left" });
        }

        const {prompt, chatId, isPublished} = req.body
        // Find or create chat
        let chat = null;
        if (chatId) {
            try {
                chat = await Chat.findOne({userId, _id: chatId});
            } catch (err) {
                // Invalid chatId fallback
            }
        }

        if (!chat) {
            chat = await Chat.create({
                userId,
                userName: req.user.name,
                name: prompt.trim().slice(0, 30) || "Image Generation",
                messages: []
            });
        }

        // Push user message
        chat.messages.push({ 
            role: "user",
            content: prompt,
            timestamp: Date.now(),
            isImage: false });

        // Encode the prompt
        const encodedPrompt = encodeURIComponent(prompt)

        // Construct ImageKit AI generation UR
        const generatedImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/flashgpt/${Date.now()}.png?tr=w-800,h-800`;

        // Trigger generation by fetching from ImageKit
        const aiImageResponse = await axios.get(generatedImageUrl, {responseType: "arraybuffer"})

        // Convert to Base64
        const base64Image = `data:image/png;base64,${Buffer.from(aiImageResponse.data,"binary").toString('base64')}`;

        // Upload to ImageKit Media Library
        const uploadResponse = await imagekit.upload({
            file: base64Image,
            fileName: `${Date.now()}.png`,
            folder: "flashgpt"
        })

        const reply = {
                role: 'assistant', 
                content: uploadResponse.url,
                timestamp: Date.now(), 
                isImage: true,
                isPublished
        }

        res.json({success: true, reply})

        chat.messages.push(reply)
        await chat.save()

        await User.updateOne({_id: userId}, { $inc: {credits: -2} })

        
            
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./db");
const crypto = require("node:crypto");
const mongoose = require("mongoose");  

const { User, Message, Track } = require("./table");


// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json()); // To parse JSON data
app.use(cors()); // Enable CORS

// Routes
app.get("/", (req, res) => {
    res.send("API is running...");
});
app.get("/giveName", async(req, res) => {
    
    try{
        const username  = req.query.username;
        console.log("d  "+username);
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.json({ message: "Username already exists ❌", uid: userExists.uid });
        }

        const uid = new mongoose.Types.ObjectId();
         console.log(username+"  done ");
        // Create new user with UID
        const newUser = new User({ username:username,uid: uid });
        await newUser.save();
        res.end();
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }   
});

app.get("/checkUname", async(req, res) => {

   try{

    const username  = req.query.username;
    const userExists = await User.findOne({ username : username });
    console.log(username);
    if (userExists) {
        return res.json({ message: "F" });
    }
    else {
        return res.json({ message: "T" });
    }
    res.send("API is running...");

} catch (error) {
    res.status(500).json({ error: "Server error" });
}
});
app.get("/cMessages", async(req, res) => {
    try {

        const username = req.query.username;
        uid=await User.findOne({ username });
        uid=uid.uid;
        const msg= req.query.msg;
        console.log(msg+"  "+uid+" "+username);
        const msgid= new mongoose.Types.ObjectId();
        const newMessage = new Message({ uid: uid, msgid: msgid, msgdescription: msg });
        await newMessage.save();
        res.json({ message: "Message created successfully ✔️", msgid: msgid });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});
app.get("/uMessages", async (req, res) => {
    try {
        const username = req.query.username;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const uid = user.uid;
        const msg = req.query.msg;

        console.log(msg + "  " + uid + " " + username);

        const updatedMessage = await Message.findOneAndUpdate(
            { uid: uid },  // Find by UID
            { msgdescription: msg }, // Update msgdescription
            
        );

        res.json({ message: "Message updated successfully ✔️", msgid: updatedMessage._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

app.delete("/dMessage", async (req, res) => {
    try {
        const { username, msgid } = req.query;

        // Find the user to get their UID
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Delete the message where both uid and msgid match
        const deletedMessage = await Message.findOneAndDelete({ uid: user.uid, msgid: msgid });

        if (!deletedMessage) {
            return res.status(404).json({ error: "Message not found or already deleted" });
        }

        res.json({ message: "Message deleted successfully ✔️" });
    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ error: "Server error" });
    }
});
app.get("/gMessages", async (req, res) => {
    try {
        const { username } = req.query;
        const user = await User.findOne({ username });

        if (!user) return res.status(404).json({ error: "User not found" });

        const messages = await Message.find({ uid: user.uid })
            .select("msgid msgdescription createdAt"); // Include createdAt in response

        if (!messages.length) return res.json({ error: "No messages found for this user" });

        res.json({ messages });
    } catch (error) {
        console.error("Error retrieving messages:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.get('/trackMessage', async (req, res) => {
    try {
        const { u: uid, m: msgid } = req.query;

        if (!uid || !msgid) {
            return res.status(400).json({ error: "Missing uid or msgid in query parameters." });
        }

        // Check if User exists
        const userExists = await User.exists({ uid: uid });
        if (!userExists) {
            return res.status(404).json({ error: "User not found." });
        }

        // Retrieve the actual message
        const message = await Message.findOne({ msgid: msgid });
        if (!message) {
            return res.status(404).json({ error: "Message not found." });
        }

        // Check if already tracked
        const isTracked = await Track.exists({ uid, msgid });
        if (isTracked) {
            return res.status(200).json({ message: "Message is already tracked.", msgdescription: "y r late", createdAt:new Date() });
        }

        // Add to Track table
        const newTrack = new Track({ uid, msgid });
        await newTrack.save();

        return res.status(201).json({
            message: "Message successfully tracked.",
            msgdescription: message.msgdescription,
            createdAt: message.createdAt
        });

    } catch (error) {
        console.error("Error tracking message:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

app.get('/nextMessage', async (req, res) => {
    try {
        const { u: uid } = req.query;

        if (!uid) {
            return res.status(400).json({ error: "Missing uid in query parameters." });
        }

        // Find all messages that are NOT tracked by this user
        const untrackedMessage = await Message.findOne({
            msgid: { $nin: await Track.distinct("msgid", { uid }) }  // Get messages not in Track for this uid
        }).sort({ msgid: 1 }); // Fetch the first available message

        if (!untrackedMessage) {
            return res.status(200).json({ nextMsgId:0 });  // If all messages are tracked
        }

        return res.status(200).json({ nextMsgId: untrackedMessage.msgid });

    } catch (error) {
        console.error("Error fetching next message:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

app.get('/getUserId', async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ uid: user.uid });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Listen on PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

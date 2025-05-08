import express from "express";
import { validateSignUpData } from "../../utils/validation.js";
import User from "../../models/userschema.js";
import bcrypt from "bcrypt";
import { adminAuth } from "../../auth/auth.js";

const authRouter = express.Router();

// Signup Route (Only Superadmins Can Create Users)
authRouter.post("/signup", async (req, res) => {
    try {
        validateSignUpData(req);
        const { name, email, password } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: passwordHash,
        });
        const savedUser = await user.save();
        const token = await savedUser.getJWT();
        res.cookie("token", token, { expires: new Date(Date.now() + 8 * 3600000) });

        const { password: _, ...userWithoutPassword } = savedUser.toObject();

        res.json({ message: "User added successfully", data: userWithoutPassword });
    } catch (error) {
        res.status(400).send("Error saving the user: " + error.message);
    }
});

// Login Route
authRouter.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });

        if (!user) {
            throw new Error("Email ID is not registered");
        }
        const isPasswordValid = await user.validatePassword(password);
        if (isPasswordValid) {
            const token = await user.getJWT();
            res.cookie("token", token, { expires: new Date(Date.now() + 8 * 3600000) });

            const { password: _, 
              orders ,cart,wishlist,
               ...userWithoutPassword } = user.toObject();
            res.send(userWithoutPassword);
        } else {
            throw new Error("Incorrect password");
        }
    } catch (error) {
        res.status(400).send("ERROR: " + error.message);
    }
});

// Logout Route
authRouter.post("/logout", async (req, res) => {
    res.cookie("token", null, { expires: new Date(Date.now()) });
    res.send("Logout successful");
});

// View User Profile Route
authRouter.get("/user/view", adminAuth , async (req, res) => {
    try {
        const user = req.admin;

        const { password , orders ,cart,wishlist,
          ...userWithoutPassword } = user.toObject();
        res.status(200).json({ message: "User profile retrieved successfully", userWithoutPassword});
    } catch (error) { 
        res.status(400).send("Error retrieving user profile: " + error.message);
    }
});
// edit user
authRouter.put("/user/edit", adminAuth , async (req, res) => {
    try {
        const userId = req.admin?._id;
    
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized: admin ID not found" });
        }
    
        const { name, phone, address } = req.body;
    
        // Check if address fields are provided, then destructure the address
        const updatedAddress = {
          street: address?.street || "",
          city: address?.city || "",
          state: address?.state || "",
          country: address?.country || "",
          pinCode: address?.pinCode || "",
        };
    
        const updateFields = {};
    
        // Only update the fields that are provided
        if (name) updateFields.name = name;
        if (phone) updateFields.phone = phone;
        if (address) updateFields.address = updatedAddress;
    
        // Proceed to update the user in the database
        const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
          new: true,
          runValidators: true,
        });
    
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }
    
        res.status(200).json({
          message: "User updated successfully",
          data: updatedUser,
        });
      } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({
          message: "Server error while updating user",
          error: err.message,
        });
      }
    })
export default authRouter;

import express, { type RequestHandler } from "express";
import session from "express-session";
import { storage } from "./storage";
import crypto from "crypto";

// Extend Express.Session with our userId property
declare module 'express-session' {
  interface SessionData {
    userId?: number | string;
  }
}

// Session storage setup
export function getSession() {
  const secret = process.env.SESSION_SECRET || "comic_book_editor_secret_key";
  
  return session({
    name: "comic_editor_sid",
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax"
    }
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  
  console.log("User not authenticated");
  return res.status(401).json({ message: "Unauthorized" });
};

// Simple password hashing
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Setup auth routes
export function setupAuth(app: express.Express) {
  console.log("Setting up simple authentication...");
  
  // Login route
  app.post("/api/simple-login", async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    try {
      // Find user by username
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        console.log(`Login attempt failed: User ${username} not found`);
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Simple password check
      const hashedPassword = hashPassword(password);
      
      if (user.password !== hashedPassword && password !== user.password) {
        console.log(`Login attempt failed: Invalid password for ${username}`);
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
            // Store user id in session directly
      req.session.userId = user.id;
      
      // Save updated session
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ message: "Session error" });
        }
        
        // Return user data without sensitive fields
        const userResponse = { ...user };
        if (userResponse.password) {
          delete userResponse.password;
        }
        
        console.log(`User ${username} logged in successfully with ID ${user.id}`);
        return res.json({ success: true, user: userResponse });
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Logout route
  app.post("/api/simple-logout", (req, res) => {
    if (!req.session) {
      return res.json({ success: true });
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      
      res.json({ success: true });
    });
  });
  
  // Get current user route
  app.get("/api/simple-user", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        console.log(`No user found for ID: ${req.session.userId}, destroying session`);
        req.session.destroy((err) => {
          if (err) console.error("Error destroying session:", err);
        });
        return res.status(401).json({ message: "User not found" });
      }
      
      // Don't send the password
      const userResponse = { ...user };
      delete userResponse.password;
      
      return res.json(userResponse);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create default admin if it doesn't exist
  createDefaultAdmin().catch(err => {
    console.error("Failed to create default admin:", err);
  });
  
  console.log("Simple authentication setup complete");
}

// Create a default admin user
async function createDefaultAdmin() {
  const adminUsername = "admin";
  
  try {
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByUsername(adminUsername);
    
    if (!existingAdmin) {
      // Create admin user with password
      const adminPassword = "admin123"; // Simple default password
      await storage.createUser({
        username: adminUsername,
        password: adminPassword,
        fullName: "Admin User",
        email: "admin@example.com",
        isEditor: true,
        role: "editor",
        editorRole: "editor_in_chief"
      });
      
      console.log(`Default admin user created`);
    }
  } catch (error) {
    console.error("Error creating default admin:", error);
    throw error;
  }
}
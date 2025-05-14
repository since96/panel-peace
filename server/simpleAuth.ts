import express, { type RequestHandler } from "express";
import session from "express-session";
import { storage } from "./storage";
import crypto from "crypto";

// Declare session data type to make TypeScript happy
declare module 'express-session' {
  interface SessionData {
    userId: number | string;
  }
}

// Middleware to check if a user is authenticated
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  
  console.log("User not authenticated");
  return res.status(401).json({ message: "Unauthorized" });
};

// Setup session store
export function getSession() {
  // Create a session middleware using express-session
  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  });
  
  return sessionMiddleware;
}

// Simple password hashing
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Setup simple username/password authentication
export function setupAuth(app: express.Express) {
  console.log("Setting up simple authentication...");
  
  // Initialize session middleware
  app.use(getSession());
  
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
      
      // Very simple password check (in a real app, use bcrypt)
      const hashedPassword = hashPassword(password);
      
      if (user.password !== hashedPassword && password !== user.password) {
        console.log(`Login attempt failed: Invalid password for ${username}`);
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set user in session
      req.session.userId = user.id;
      
      console.log(`User ${username} logged in successfully`);
      return res.json({ success: true, user });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Logout route
  app.post("/api/simple-logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      
      res.json({ success: true });
    });
  });
  
  // Get current user
  app.get("/api/simple-user", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }
      
      return res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Register default admin user if it doesn't exist
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
      const admin = await storage.createUser({
        username: adminUsername,
        password: adminPassword,
        fullName: "Admin User",
        email: "admin@example.com",
        isEditor: true,
        role: "editor",
        editorRole: "editor_in_chief"
      });
      
      console.log(`Default admin user created with ID: ${admin.id}`);
    }
  } catch (error) {
    console.error("Error creating default admin:", error);
    throw error;
  }
}
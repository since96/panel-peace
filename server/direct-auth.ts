import express, { type RequestHandler } from "express";
import session from "express-session";
import { storage } from "./storage";
import crypto from "crypto";

// Declare session data type to make TypeScript happy
declare module 'express-session' {
  interface SessionData {
    userId?: number | string;
  }
}

// Simple middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = (req, res, next) => {
  console.log('Checking authentication, session:', req.session);
  if (req.session && req.session.userId) {
    console.log('Session authenticated with userId:', req.session.userId);
    // Attach user to request for convenience
    (req as any).user = { id: req.session.userId };
    return next();
  }
  
  console.log('No userId in session, authentication failed');
  return res.status(401).json({ message: "Unauthorized" });
};

// Simple password hashing
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Setup direct authentication routes
export function setupDirectAuth(app: express.Express) {
  console.log("Setting up direct authentication...");
  
  // Use session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || "comic_editor_direct_auth",
    name: "comic_editor_sid",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  }));
  
  // Direct login endpoint
  app.post("/api/direct-login", async (req, res) => {
    console.log("Received login request:", req.body);
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }
    
    try {
      // Find the user
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        console.log(`Login failed: User '${username}' not found`);
        return res.status(401).json({
          success: false,
          message: "Invalid username or password"
        });
      }
      
      // Check password
      const hashedPassword = hashPassword(password);
      
      // Check both hashed and plain (for dev environment)
      if (user.password !== hashedPassword && password !== user.password) {
        console.log(`Login failed: Invalid password for user '${username}'`);
        return res.status(401).json({
          success: false,
          message: "Invalid username or password"
        });
      }
      
      // Set user ID in session
      req.session.userId = user.id;
      
      // Create a safe user object without password
      const safeUser = { ...user };
      delete safeUser.password;
      
      console.log(`User '${username}' logged in successfully with ID ${user.id}`);
      
      // Return success
      res.json({
        success: true,
        user: safeUser
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred during login"
      });
    }
  });
  
  // Get current user
  app.get("/api/direct-user", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }
    
    try {
      console.log(`Getting user data for ID: ${req.session.userId}`);
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        console.log(`No user found for ID: ${req.session.userId}`);
        req.session.destroy(() => {});
        return res.status(401).json({
          success: false,
          message: "User not found"
        });
      }
      
      // Create a safe user object without password
      const safeUser = { ...user };
      delete safeUser.password;
      
      console.log(`User found: ${user.fullName || user.username}`);
      
      res.json({
        success: true,
        user: safeUser
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while fetching user data"
      });
    }
  });
  
  // Logout endpoint
  app.post("/api/direct-logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to logout"
          });
        }
        
        res.json({
          success: true,
          message: "Logged out successfully"
        });
      });
    } else {
      res.json({
        success: true,
        message: "Already logged out"
      });
    }
  });
  
  // Create default admin user if it doesn't exist
  createDefaultAdmin().catch(err => {
    console.error("Failed to create default admin:", err);
  });
  
  console.log("Direct authentication setup complete");
}

// Create a default admin user
async function createDefaultAdmin() {
  const adminUsername = "admin";
  
  try {
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByUsername(adminUsername);
    
    if (!existingAdmin) {
      // Create admin user with password
      const adminPassword = "admin123"; // Default password for testing
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
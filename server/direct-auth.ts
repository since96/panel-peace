import express, { type RequestHandler } from "express";
import { storage } from "./storage";
import crypto from "crypto";
import jwt from 'jsonwebtoken';

// The JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'comic_editor_jwt_secret_key';

// Authentication middleware
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    // Get the token from the cookie
    const token = req.cookies?.auth_token;
    
    if (!token) {
      console.log('Authentication check bypassed - using admin user');
      // TEMP: Set admin user as the authenticated user for development
      (req as any).user = { id: 1 };
      return next();
    }
    
    try {
      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number | string };
      
      if (!decoded || !decoded.id) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      
      // Get user from database
      const user = await storage.getUser(decoded.id);
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      
      // Set user in request
      (req as any).user = user;
      return next();
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Simple password hashing
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Setup direct authentication routes
export function setupDirectAuth(app: express.Express) {
  console.log("Setting up direct authentication with JWT...");
  
  // Signup endpoint
  app.post("/api/signup", async (req, res) => {
    console.log("Received signup request:", req.body);
    
    const { username, password, fullName, email, isEditor, editorRole, role } = req.body;
    
    if (!username || !password || !fullName || !email) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: username, password, fullName, and email"
      });
    }
    
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already exists"
        });
      }
      
      // Create the new user
      const newUser = await storage.createUser({
        username,
        password,
        fullName,
        email,
        isEditor: isEditor || false,
        editorRole: editorRole || "editor",
        role: role || "Editor",
        roles: ["editor"]
      });
      
      // Create a safe user object without password
      const safeUser = { ...newUser } as any;
      if (safeUser.password) delete safeUser.password;
      
      console.log(`New user created: ${username}`);
      
      res.status(201).json({
        success: true,
        message: "User created successfully",
        user: safeUser
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred during signup"
      });
    }
  });
  
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
      
      // Create JWT token
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
      
      // Create a safe user object without password
      const safeUser = { ...user } as any;
      if (safeUser.password) delete safeUser.password;
      
      console.log(`User '${username}' logged in successfully with ID ${user.id}`);
      
      // Set the token as an HTTP-only cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax',
        path: '/',
      });
      
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
    try {
      // Get the token from the cookie
      const token = req.cookies.auth_token;
      
      // If there's no token, use the current fix that bypasses authentication
      if (!token) {
        console.log("No auth token, falling back to admin user");
        const userId = 1; // Admin user ID
        
        console.log(`Getting user data for admin ID: ${userId}`);
        const user = await storage.getUser(userId);
        
        if (!user) {
          console.log(`No user found for ID: ${userId}`);
          res.clearCookie('auth_token');
          return res.status(401).json({
            success: false,
            message: "User not found"
          });
        }
        
        // Create a safe user object without password
        const safeUser = { ...user } as any;
        if (safeUser.password) delete safeUser.password;
        
        console.log(`User found: ${user.fullName || user.username}`);
        
        return res.json({
          success: true,
          user: safeUser
        });
      }
      
      // Verify the token
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number | string };
        const userId = decoded.id;
        
        console.log(`Getting user data for ID from token: ${userId}`);
        const user = await storage.getUser(userId);
        
        if (!user) {
          console.log(`No user found for token ID: ${userId}`);
          res.clearCookie('auth_token');
          return res.status(401).json({
            success: false,
            message: "User not found"
          });
        }
        
        // Create a safe user object without password
        const safeUser = { ...user } as any;
        if (safeUser.password) delete safeUser.password;
        
        console.log(`User found from token: ${user.fullName || user.username}`);
        
        res.json({
          success: true,
          user: safeUser
        });
      } catch (jwtError) {
        console.error("JWT verification failed:", jwtError);
        res.clearCookie('auth_token');
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token"
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.clearCookie('auth_token');
      res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }
  });
  
  // Logout endpoint
  app.post("/api/direct-logout", (req, res) => {
    res.clearCookie('auth_token');
    res.json({
      success: true,
      message: "Logged out successfully"
    });
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
        fullName: "Admin",
        email: "admin@comicsmanagement.com",
        isEditor: true,
        role: "Editor",
        editorRole: "editor_in_chief"
      });
      
      console.log(`Default admin user created`);
    }
  } catch (error) {
    console.error("Error creating default admin:", error);
    throw error;
  }
}
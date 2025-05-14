import express, { type RequestHandler } from "express";
import { storage } from "./storage";
import crypto from "crypto";
import jwt from 'jsonwebtoken';

// The JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'comic_editor_jwt_secret_key';

// Simple middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = (req, res, next) => {
  try {
    // Get the token from cookies
    const token = req.cookies.auth_token;
    
    console.log('Checking authentication, token:', token ? 'present' : 'not present');
    
    if (!token) {
      console.log('No token found, authentication failed');
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number | string };
    console.log('Token verified, user ID:', decoded.id);
    
    // Attach the user ID to the request
    (req as any).user = { id: decoded.id };
    
    return next();
  } catch (error) {
    console.log('Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// Simple password hashing
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Setup direct authentication routes
export function setupDirectAuth(app: express.Express) {
  console.log("Setting up direct authentication with JWT...");
  
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
      // Get the token from cookies
      const token = req.cookies.auth_token;
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }
      
      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number | string };
      const userId = decoded.id;
      
      console.log(`Getting user data for ID: ${userId}`);
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
      
      res.json({
        success: true,
        user: safeUser
      });
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
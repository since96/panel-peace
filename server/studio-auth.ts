import express, { RequestHandler } from "express";
import { storage } from "./storage";
import * as crypto from "crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { insertStudioSchema, insertUserSchema } from "@shared/schema";

// Schema for studio creation
const studioSignupSchema = z.object({
  studioData: insertStudioSchema,
  userData: insertUserSchema.extend({
    password: z.string().min(6),
    isEditor: z.boolean().optional().default(true),
    editorRole: z.string().optional().default("editor_in_chief"),
  }),
});

// Hash password function
function hashPassword(password: string): string {
  // In a real application, you would use a proper password hashing library like bcrypt
  // This is a simple hash for demo purposes
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Middleware to check if user is a site admin
export const isSiteAdmin: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req as any)?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!user.isSiteAdmin) {
      return res.status(403).json({ message: "Site admin access required" });
    }
    
    next();
  } catch (error) {
    console.error("Error in site admin middleware:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Middleware to check if user is an Editor-in-Chief
export const isEditorInChief: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req as any)?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!user.isEditor || user.editorRole !== "editor_in_chief") {
      return res.status(403).json({ message: "Editor-in-chief access required" });
    }
    
    next();
  } catch (error) {
    console.error("Error in EIC middleware:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Studio signup endpoint
export function setupStudioAuth(app: express.Express) {
  // Create a new studio with an Editor-in-Chief
  app.post("/api/studio/signup", async (req, res) => {
    try {
      // Validate the request
      const validationResult = studioSignupSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid studio signup data",
          errors: validationResult.error.format()
        });
      }
      
      const { studioData, userData } = validationResult.data;
      
      // Check if username already exists for the EIC
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already exists"
        });
      }
      
      // Create the studio
      const studio = await storage.createStudio({
        name: studioData.name,
        description: studioData.description || '',
        logoUrl: studioData.logoUrl || null,
        // By default, use admin as creator, will be updated after EIC is created
        createdBy: 1, 
        active: false, // Require site admin approval
      });
      
      // Create Editor-in-Chief user with proper type handling
      const newUser = await storage.createUser({
        username: userData.username,
        password: hashPassword(userData.password || ''),
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        socialMedia: userData.socialMedia,
        isEditor: true,
        editorRole: 'editor_in_chief',
        isSiteAdmin: false,
        // Add studioId to user's properties
        assignedProjects: userData.assignedProjects,
        role: userData.role,
        roles: userData.roles,
        avatarUrl: userData.avatarUrl,
      });
      
      // Update user with studioId using a separate call to avoid type issues
      await storage.updateUser(newUser.id, {
        studioId: studio.id
      });
      
      // Update the studio with the actual creator
      await storage.updateStudio(studio.id, {
        createdBy: newUser.id
      });
      
      console.log(`New studio '${studioData.name}' created with EIC ${userData.username}`);
      
      // Return success
      return res.status(201).json({
        success: true,
        message: "Studio and Editor-in-Chief created successfully, pending approval",
        studio,
        user: {
          ...newUser,
          password: undefined // Don't send password back
        }
      });
    } catch (error) {
      console.error("Studio signup error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during studio signup"
      });
    }
  });

  // Approve a studio (site admin only)
  app.post("/api/studios/:id/approve", isSiteAdmin, async (req, res) => {
    try {
      const studioId = parseInt(req.params.id);
      if (isNaN(studioId)) {
        return res.status(400).json({ message: "Invalid studio ID" });
      }
      
      const studio = await storage.getStudio(studioId);
      if (!studio) {
        return res.status(404).json({ message: "Studio not found" });
      }
      
      // Approve the studio
      const updatedStudio = await storage.updateStudio(studioId, {
        active: true
      });
      
      res.json({
        success: true,
        message: "Studio approved successfully",
        studio: updatedStudio
      });
    } catch (error) {
      console.error("Error approving studio:", error);
      res.status(500).json({ message: "Failed to approve studio" });
    }
  });
}
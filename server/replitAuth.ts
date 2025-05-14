import passport from "passport";
import { Strategy as OAuth2Strategy, type VerifyCallback } from "passport-oauth2";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import axios from "axios";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

if (!process.env.REPL_ID) {
  throw new Error("Environment variable REPL_ID not provided");
}

// This is the Replit OAuth configuration
const REPLIT_OAUTH_CONFIG = {
  authorizationURL: "https://replit.com/auth_with_repl_site",
  tokenURL: "https://replit.com/api/v1/auth/token",
  userProfileURL: "https://replit.com/api/v1/users/current",
  clientID: process.env.REPL_ID,
  callbackURL: `https://${process.env.REPLIT_DOMAINS.split(",")[0]}/api/callback`,
  // Use proper query parameters for auth
  authorizationParams: {
    domain: process.env.REPLIT_DOMAINS.split(",")[0],
    client_id: process.env.REPL_ID,
    redirect_uri: `https://${process.env.REPLIT_DOMAINS.split(",")[0]}/api/callback`,
    response_type: "code",
    scope: "identity",
  },
  scope: ["identity"],
  passReqToCallback: true,
};

// Session configuration
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conObject: {
      connectionString: process.env.DATABASE_URL,
    },
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET ?? "comic-book-creator-secret-key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false to work in development, in production should be true
      maxAge: sessionTtl,
    },
  });
}

// Fetch user profile from Replit
async function fetchUserProfile(accessToken: string) {
  try {
    console.log("Fetching user profile with token...");
    const response = await axios.get(REPLIT_OAUTH_CONFIG.userProfileURL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    
    console.log("User profile response status:", response.status);
    return response.data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    // Create a minimal profile with what we know
    return {
      id: "unknown",
      username: "unknown_user",
      email: "unknown@example.com",
    };
  }
}

// Process and save user to database
async function processUser(profile: any) {
  console.log("Processing user profile:", JSON.stringify(profile));
  
  // Generate a unique ID if not provided
  const userId = profile.id || `replit_${Date.now()}`;
  
  // Upsert the user in our database with default editor role
  return await storage.upsertUser({
    id: userId,
    email: profile.email || `${profile.username || "user"}@example.com`,
    fullName: profile.name || profile.username || "Replit User",
    username: profile.username || `user_${userId}`,
    avatarUrl: profile.profileImage || null,
    isEditor: true, // Making authenticated users editors by default
    editorRole: "editor", // Default role
    role: "editor",
    password: null
  });
}

// Setup authentication with Passport
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  try {
    console.log("Setting up authentication...");
    console.log("Auth config:", {
      authorizationURL: REPLIT_OAUTH_CONFIG.authorizationURL,
      tokenURL: REPLIT_OAUTH_CONFIG.tokenURL,
      clientID: REPLIT_OAUTH_CONFIG.clientID,
      callbackURL: REPLIT_OAUTH_CONFIG.callbackURL,
    });

    // Custom OAuth2 strategy for Replit
    // Replit doesn't require a client secret for its OAuth2 flow
    passport.use('replit', new OAuth2Strategy({
      authorizationURL: REPLIT_OAUTH_CONFIG.authorizationURL,
      tokenURL: REPLIT_OAUTH_CONFIG.tokenURL,
      clientID: REPLIT_OAUTH_CONFIG.clientID,
      clientSecret: 'NO_SECRET_NEEDED', // This is a dummy value as Replit doesn't require a client secret
      callbackURL: REPLIT_OAUTH_CONFIG.callbackURL,
      customHeaders: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      scope: "identity",
      passReqToCallback: false, // Don't pass request to callback for simplicity
    }, async (accessToken: string, refreshToken: string, params: any, profile: any, done: VerifyCallback) => {
      try {
        console.log("OAuth callback triggered with tokens:", {
          accessToken: accessToken ? "present" : "missing",
          refreshToken: refreshToken ? "present" : "missing",
        });
        
        // Fetch the user profile from Replit API
        const userProfile = await fetchUserProfile(accessToken);
        console.log("Retrieved user profile:", JSON.stringify(userProfile));
        
        // Create the user session object
        const user: any = {
          profile: userProfile,
          access_token: accessToken,
          refresh_token: refreshToken || null,
          expires_at: Date.now() + 3600 * 1000, // 1 hour expiry
        };

        // Process and store user in our database
        try {
          const dbUser = await processUser(userProfile);
          console.log("Stored user in database:", JSON.stringify(dbUser));
          user.dbUser = dbUser;
        } catch (dbError) {
          console.error("Error storing user in database:", dbError);
        }

        return done(null, user);
      } catch (error) {
        console.error("Error in OAuth verify callback:", error);
        return done(error as Error);
      }
    }));

    // Set up serialization/deserialization of user
    passport.serializeUser((user: Express.User, cb) => {
      console.log("Serializing user");
      cb(null, user);
    });
    
    passport.deserializeUser((user: Express.User, cb) => {
      console.log("Deserializing user");
      cb(null, user);
    });

    // Authentication routes
    app.get("/api/login", (req, res, next) => {
      const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
      console.log("Login attempt with domain:", domain);
      
      if (!domain) {
        console.error("No domain found in REPLIT_DOMAINS environment variable");
        return res.redirect("/login-page.html?error=missing_domain");
      }
      
      // Construct the auth URL with all required parameters
      const authUrl = new URL(REPLIT_OAUTH_CONFIG.authorizationURL);
      authUrl.searchParams.append("domain", domain);
      authUrl.searchParams.append("client_id", process.env.REPL_ID || "");
      authUrl.searchParams.append("redirect_uri", REPLIT_OAUTH_CONFIG.callbackURL);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("scope", "identity");
      
      console.log("Redirecting to auth URL:", authUrl.toString());
      return res.redirect(authUrl.toString());
    });
    
    // Redirect login page requests to our custom login page
    app.get("/login", (req, res) => {
      res.redirect("/login-page.html");
    });

    app.get("/api/callback", async (req, res, next) => {
      console.log("Auth callback received with query params:", req.query);
      
      try {
        // Check if the code is present
        if (!req.query.code) {
          console.error("No code found in callback");
          return res.redirect("/login-page.html?error=no_code");
        }
        
        const code = req.query.code as string;
        console.log("Auth code received:", code.substring(0, 10) + "...");
        
        try {
          console.log("Exchanging code for token...");
          // Exchange the code for an access token
          const tokenResponse = await axios.post(
            REPLIT_OAUTH_CONFIG.tokenURL,
            {
              client_id: process.env.REPL_ID,
              code,
              redirect_uri: REPLIT_OAUTH_CONFIG.callbackURL,
              grant_type: "authorization_code",
            },
            {
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
            }
          );
          
          console.log("Token response received with status:", tokenResponse.status);
          
          if (tokenResponse.data && tokenResponse.data.access_token) {
            console.log("Access token received, fetching user profile");
            
            // Get user profile with the access token
            const userProfile = await fetchUserProfile(tokenResponse.data.access_token);
            
            if (!userProfile || !userProfile.id) {
              console.error("Invalid user profile:", userProfile);
              return res.redirect("/login-page.html?error=invalid_profile");
            }
            
            console.log("User profile fetched successfully with ID:", userProfile.id);
            
            // Create a user object 
            const user: any = {
              profile: userProfile,
              access_token: tokenResponse.data.access_token,
              expires_at: Date.now() + (tokenResponse.data.expires_in || 3600) * 1000,
            };
            
            // Process and store in database
            console.log("Storing user in database...");
            const dbUser = await processUser(userProfile);
            user.dbUser = dbUser;
            console.log("User stored in database with ID:", dbUser.id);
            
            // Log the user in
            req.login(user, (err) => {
              if (err) {
                console.error("Error logging in user:", err);
                return res.redirect('/auth-redirect.html?error=login_failed');
              }
              
              // After successful login, always redirect to the static auth page
              console.log("Authentication successful, redirecting to auth redirect page");
              return res.redirect('/auth-redirect.html');
            });
          } else {
            console.error("No access token found in response");
            return res.redirect("/login-page.html?error=no_access_token");
          }
        } catch (tokenError: any) {
          console.error("Error exchanging code for token:", tokenError.message);
          if (tokenError.response) {
            console.error("Response status:", tokenError.response.status);
            console.error("Response data:", JSON.stringify(tokenError.response.data));
          }
          return res.redirect("/login-page.html?error=token_exchange_failed");
        }
      } catch (error: any) {
        console.error("Error in callback:", error.message);
        return res.redirect('/login-page.html?error=general_error');
      }
    });

    app.get("/api/logout", (req, res) => {
      console.log("Logging out user");
      req.logout(() => {
        res.redirect("/");
      });
    });

    // Debug endpoint to check auth status
    app.get("/api/auth/status", (req, res) => {
      console.log("Auth status check, authenticated:", req.isAuthenticated());
      console.log("Session data:", req.session);
      console.log("User data:", req.user);
      
      res.json({
        isAuthenticated: req.isAuthenticated(),
        user: req.user ? {
          id: (req.user as any)?.dbUser?.id,
          username: (req.user as any)?.dbUser?.username,
          isEditor: (req.user as any)?.dbUser?.isEditor,
          profile: (req.user as any)?.profile,
        } : null,
        session: req.session ? 'present' : 'missing',
      });
    });

    console.log("Authentication setup complete");
  } catch (error) {
    console.error("Error setting up authentication:", error);
    throw error;
  }
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated()) {
    console.log("User not authenticated");
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  console.log("User authenticated, proceeding");
  return next();
};
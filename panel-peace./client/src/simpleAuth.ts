// Define the session data type to include userId
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}
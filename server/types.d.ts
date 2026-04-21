import { UserRole } from "@shared/api";

declare global {
  namespace Express {
    interface Request {
      session?: {
        userId: string;
        role: UserRole;
      };
    }
  }
}

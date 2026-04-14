import { DecodedIdToken } from "firebase-admin/auth";
import { User, IUser } from "./models/User.model.js";

export class AuthService {
  /**
   * Sync user from Firebase to MongoDB
   * Creates new user if doesn't exist, updates if exists
   */
  async syncUserFromFirebase(decodedToken: DecodedIdToken): Promise<IUser> {
    const { uid, email, name, picture, phone_number } = decodedToken;

    if (!email) {
      throw new Error("Email is required from Firebase token");
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      {
        $set: {
          email: email.toLowerCase(),
          displayName: name,
          photoURL: picture,
          phone: phone_number,
          lastLoginAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return user;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  /**
   * Get user by Firebase UID
   */
  async getUserByFirebaseUid(firebaseUid: string): Promise<IUser | null> {
    return User.findOne({ firebaseUid });
  }

  /**
   * Update FCM token for user
   */
  async updateFCMToken(
    firebaseUid: string,
    fcmToken: string,
    lastLoginAt?: Date,
    appVersion?: string
  ): Promise<IUser> {
    const updateData: any = { fcmToken };

    if (lastLoginAt) {
      updateData.lastLoginAt = lastLoginAt;
    }

    if (appVersion) {
      updateData.appVersion = appVersion;
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /**
   * Update user profile (name and phone)
   */
  async updateProfile(firebaseUid: string, displayName?: string, phone?: string): Promise<IUser> {
    const updateData: any = {};

    if (displayName !== undefined) {
      updateData.displayName = displayName || null;
    }

    if (phone !== undefined) {
      updateData.phone = phone || null;
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }
}

export const authService = new AuthService();

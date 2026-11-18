import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: ['super_admin', 'organizer', 'attendee', 'staff'],
      default: 'attendee',
      required: true,
    },
    interests: {
      type: [String],
      default: [],
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

// Index on email is already unique; add index on role for quick filtering
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

export default User;

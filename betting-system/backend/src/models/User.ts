import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  password?: string;
  coins: number;
  wineGlasses: number;
  rounds: number;
  isAdmin: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, unique: true, trim: true },
  password: { type: String },
  coins: { type: Number, default: 200000 },
  wineGlasses: { type: Number, default: 0 },
  rounds: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);

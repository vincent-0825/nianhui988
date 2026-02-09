import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  initialCoins: number;
  minBet: number;
  maxBet: number;
  totalPrizePool: number;
  currentPool: number;
  gameOver: boolean;
}

const SettingsSchema = new Schema<ISettings>({
  initialCoins: { type: Number, default: 200000 },
  minBet: { type: Number, default: 50000 },
  maxBet: { type: Number, default: 10000000 },
  totalPrizePool: { type: Number, default: 10000000 },
  currentPool: { type: Number, default: 10000000 },
  gameOver: { type: Boolean, default: false },
});

export default mongoose.model<ISettings>('Settings', SettingsSchema);

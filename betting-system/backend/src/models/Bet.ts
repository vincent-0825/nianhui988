import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBet extends Document {
  userId: Types.ObjectId;
  themeId: Types.ObjectId;
  optionId: Types.ObjectId;
  amount: number;
  useWineGlass: boolean;
  createdAt: Date;
}

const BetSchema = new Schema<IBet>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  themeId: { type: Schema.Types.ObjectId, ref: 'Theme', required: true },
  optionId: { type: Schema.Types.ObjectId, required: true },
  amount: { type: Number, required: true, min: 50000 },
  useWineGlass: { type: Boolean, default: false },
}, { timestamps: true });

// 每个用户每个主题只能押注一次
BetSchema.index({ userId: 1, themeId: 1 }, { unique: true });

export default mongoose.model<IBet>('Bet', BetSchema);

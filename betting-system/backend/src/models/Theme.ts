import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOption {
  _id: Types.ObjectId;
  name: string;
}

export interface ITheme extends Document {
  title: string;
  description: string;
  status: 'open' | 'closed';
  settlementMode: 'admin' | 'random';
  winnerOptionId: Types.ObjectId | null;
  options: IOption[];
  createdAt: Date;
}

const OptionSchema = new Schema<IOption>({
  name: { type: String, required: true },
});

const ThemeSchema = new Schema<ITheme>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  settlementMode: { type: String, enum: ['admin', 'random'], default: 'admin' },
  winnerOptionId: { type: Schema.Types.ObjectId, default: null },
  options: [OptionSchema],
}, { timestamps: true });

export default mongoose.model<ITheme>('Theme', ThemeSchema);

import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import type { IUser } from './User';

export interface IAlert extends Document {
  user: Types.ObjectId | IUser;
  title: string;
  status: 'read' | 'unread';
  createdAt: Date;
  updatedAt: Date;
}

const alertSchema = new Schema<IAlert>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['read', 'unread'], 
    default: 'unread' 
  },
}, { timestamps: true });

const AlertModel: Model<IAlert> = mongoose.models.Alert || mongoose.model<IAlert>('Alert', alertSchema);

export default AlertModel;

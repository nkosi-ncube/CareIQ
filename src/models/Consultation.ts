import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import type { IUser } from './User';

export interface IConsultation extends Document {
  patient: Types.ObjectId | IUser;
  hcp: Types.ObjectId | IUser;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  symptomsSummary: string;
  aiAnalysis: object;
  consultationNotes?: string;
  postConsultationSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const consultationSchema = new Schema<IConsultation>({
  patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  hcp: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['waiting', 'active', 'completed', 'cancelled'], 
    default: 'waiting' 
  },
  symptomsSummary: { type: String, required: true },
  aiAnalysis: { type: Object, required: true },
  consultationNotes: { type: String },
  postConsultationSummary: { type: String },
}, { timestamps: true });

const ConsultationModel: Model<IConsultation> = mongoose.models.Consultation || mongoose.model<IConsultation>('Consultation', consultationSchema);

export default ConsultationModel;

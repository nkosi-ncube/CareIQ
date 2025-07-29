import mongoose, { Schema, Model } from 'mongoose';
import type { Document } from 'mongoose';

const SouthAfricanMedicalAids = [
    "Discovery Health", "Bonitas", "Momentum Health", "Fedhealth", 
    "Medihelp", "Bestmed", "Profmed", "Keyhealth", "Sizwe-Hosmed", "Netcare Medical Scheme"
];

const hcpSpecialties = [
    "Cardiology", "Dermatology", "Gastroenterology", "Neurology", 
    "Oncology", "Orthopedics", "Pediatrics", "Psychiatry", "Urology", "General Practice"
];

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'patient' | 'hcp';
  // Patient specific fields
  paymentMethod?: 'card' | 'medicalAid';
  medicalAidInfo?: {
    name: string;
    memberNumber: string;
  };
  // HCP specific fields
  practiceNumber?: string;
  specialty?: string;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, required: true, enum: ['patient', 'hcp'] },
  practiceNumber: { 
    type: String, 
    required: function(this: IUser) { return this.role === 'hcp'; } 
  },
  specialty: {
    type: String,
    enum: hcpSpecialties,
    required: function(this: IUser) { return this.role === 'hcp'; }
  },
  paymentMethod: { 
    type: String, 
    enum: ['card', 'medicalAid'],
    required: function(this: IUser) { return this.role === 'patient'; }
  },
  medicalAidInfo: {
    name: { 
        type: String,
        enum: SouthAfricanMedicalAids,
        required: function(this: IUser) { return this.paymentMethod === 'medicalAid'; }
    },
    memberNumber: { 
        type: String,
        required: function(this: IUser) { return this.paymentMethod === 'medicalAid'; }
    }
  }
}, { timestamps: true });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;

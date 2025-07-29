import mongoose, { Schema } from 'mongoose';
import type { Document, Model } from 'mongoose';

const SouthAfricanMedicalAids = [
    "Discovery Health", "Bonitas", "Momentum Health", "Fedhealth", 
    "Medihelp", "Bestmed", "Profmed", "Keyhealth", "Sizwe-Hosmed", "Netcare Medical Scheme"
];

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'patient' | 'hcp';
  // Patient specific fields
  paymentMethod?: 'cash' | 'medicalAid';
  medicalAidInfo?: {
    name: string;
    memberNumber: string;
  };
  // HCP specific fields
  practiceNumber?: string;
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
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'medicalAid'],
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

const User: Model<
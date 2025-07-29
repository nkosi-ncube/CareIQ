import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import type { IUser } from './User';

export interface IDiagnosticTest extends Document {
  _id: string;
  user: Types.ObjectId | IUser;
  name: string;
  result: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const diagnosticTestSchema = new Schema<IDiagnosticTest>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  result: { type: String, required: true },
  date: { type: Date, required: true },
}, { timestamps: true });

const DiagnosticTestModel: Model<IDiagnosticTest> = mongoose.models.DiagnosticTest || mongoose.model<IDiagnosticTest>('DiagnosticTest', diagnosticTestSchema);

export default DiagnosticTestModel;

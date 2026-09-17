import mongoose from "mongoose";

export interface ICompany extends mongoose.Document {
  name: string;
  code: string;
}

const companySchema = new mongoose.Schema<ICompany>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICompany>("Company", companySchema);
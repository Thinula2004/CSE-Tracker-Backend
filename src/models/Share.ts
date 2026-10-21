import mongoose from "mongoose";

export interface IShares extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  amount: number;
  avgCost: number;
  totalCost: number;
}

const sharesSchema = new mongoose.Schema<IShares>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      default: 0,
    },

    avgCost: {
      type: Number,
      required: true,
      default: 0,
    },

    totalCost: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

sharesSchema.index(
  { userId: 1, companyId: 1 },
  { unique: true }
);

export default mongoose.model<IShares>("Shares", sharesSchema);
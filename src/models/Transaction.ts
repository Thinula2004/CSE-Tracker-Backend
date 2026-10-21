import mongoose from "mongoose";

export interface ITransaction extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;

  type: "BUY" | "SELL" | "DIVIDEND";

  shareCount: number | null;
  pricePerShare: number | null;
  handlingFee: number;

  grossAmount: number;
  netAmount: number;
  realizedGain: number;

  date: Date;
  notes: string | null;
}

const transactionSchema = new mongoose.Schema<ITransaction>(
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

    type: {
      type: String,
      enum: ["BUY", "SELL", "DIVIDEND"],
      required: true,
    },

    shareCount: {
      type: Number,
      default: null,
    },

    pricePerShare: {
      type: Number,
      default: null,
    },

    handlingFee: {
      type: Number,
      required: true,
      default: 0,
    },

    grossAmount: {
      type: Number,
      required: true,
    },

    netAmount: {
      type: Number,
      required: true,
    },

    realizedGain: {
      type: Number,
      required: true,
      default: 0,
    },

    date: {
      type: Date,
      required: true,
    },

    notes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({
  userId: 1,
  companyId: 1,
  date: 1,
});

export default mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema
);
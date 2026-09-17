import mongoose from "mongoose";

export interface IMarketPrice extends mongoose.Document {
  companyId: mongoose.Types.ObjectId;
  price: number;
  date: Date;
}

const marketPriceSchema = new mongoose.Schema<IMarketPrice>(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
  }
);

export default mongoose.model<IMarketPrice>(
  "MarketPrice",
  marketPriceSchema
);
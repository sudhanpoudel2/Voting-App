import mongoose, { Schema } from "mongoose";

const candidateSchema = new Schema(
  {
    name: { type: String },
    party: { type: String },
    image: { type: String },
    votes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        votedAt: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    voteCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Candidate = mongoose.model("Candidate", candidateSchema);

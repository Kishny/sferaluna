// src/models/MentorPost.ts

import mongoose, { Schema, Document, Model, models } from "mongoose";

export type MentorCategory =
  | "premier-contact"
  | "profil"
  | "rencontre"
  | "relation"
  | "securite"
  | "autre";

export interface IMentorAnswer {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  likes: mongoose.Types.ObjectId[];
  isAccepted: boolean;
  createdAt: Date;
}

export interface IMentorPost extends Document {
  userId: mongoose.Types.ObjectId;
  question: string;
  category: MentorCategory;
  answers: IMentorAnswer[];
  likes: mongoose.Types.ObjectId[];
  isSolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema = new Schema<IMentorAnswer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 1000, trim: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isAccepted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const MentorPostSchema = new Schema<IMentorPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    question: { type: String, required: true, maxlength: 500, trim: true },
    category: {
      type: String,
      enum: ["premier-contact", "profil", "rencontre", "relation", "securite", "autre"],
      required: true,
    },
    answers: [AnswerSchema],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isSolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MentorPostSchema.index({ category: 1, createdAt: -1 });

export const MentorPost: Model<IMentorPost> =
  (models.MentorPost as Model<IMentorPost>) ||
  mongoose.model<IMentorPost>("MentorPost", MentorPostSchema);

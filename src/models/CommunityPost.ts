// src/models/CommunityPost.ts

import mongoose, { Schema, Document, Model, models } from "mongoose";

export type CommunityCategory =
  | "rencontres"
  | "conseils"
  | "sorties"
  | "bien-etre"
  | "humour"
  | "general";

export interface IComment {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

export interface ICommunityPost extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  category: CommunityCategory;
  emoji: string;
  likes: mongoose.Types.ObjectId[];
  comments: IComment[];
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 500, trim: true },
  },
  { timestamps: true }
);

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, maxlength: 150, trim: true },
    content: { type: String, required: true, maxlength: 2000, trim: true },
    category: {
      type: String,
      enum: ["rencontres", "conseils", "sorties", "bien-etre", "humour", "general"],
      required: true,
    },
    emoji: { type: String, required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [CommentSchema],
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CommunityPostSchema.index({ category: 1, createdAt: -1 });
CommunityPostSchema.index({ createdAt: -1 });

export const CommunityPost: Model<ICommunityPost> =
  (models.CommunityPost as Model<ICommunityPost>) ||
  mongoose.model<ICommunityPost>("CommunityPost", CommunityPostSchema);

// src/models/Testimonial.ts

import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type TestimonialStatus = "pending" | "approved" | "rejected";

export interface ITestimonial extends Document {
  userId: Types.ObjectId;
  authorName: string; // pseudonyme affiché (jamais le vrai nom)
  age?: number;
  content: string;
  status: TestimonialStatus;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    age: {
      type: Number,
      min: 18,
      max: 99,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Un seul témoignage par utilisateur
TestimonialSchema.index({ userId: 1 }, { unique: true });

export const Testimonial: Model<ITestimonial> =
  mongoose.models.Testimonial ||
  mongoose.model<ITestimonial>("Testimonial", TestimonialSchema);

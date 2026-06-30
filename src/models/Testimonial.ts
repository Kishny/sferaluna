// src/models/Testimonial.ts

import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type TestimonialStatus = "pending" | "approved" | "rejected";

export interface ITestimonial extends Document {
  userId: Types.ObjectId;
  authorName: string; // pseudonyme affiché (jamais le vrai nom)
  age?: number;
  city?: string; // ville affichée (optionnelle)
  content: string;
  rating: number; // note 1-5 étoiles
  avatar?: string; // snapshot de la photo de profil au moment de la soumission
  showAvatar: boolean; // consentement explicite pour afficher la photo
  featured: boolean; // mis en avant / épinglé par un admin
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
    city: {
      type: String,
      trim: true,
      maxlength: 60,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 500,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 5,
    },
    avatar: {
      type: String,
      trim: true,
    },
    showAvatar: {
      type: Boolean,
      default: false,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
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

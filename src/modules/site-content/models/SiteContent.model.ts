import mongoose, { Schema, Document } from "mongoose";

export interface SocialLink {
  title: string;
  url: string;
}

export interface PointItem {
  title: string;
  description: string;
}

export interface TermItem {
  title: string;
  description: string;
}

export type SiteContentType = "about" | "points" | "terms" | "faq" | "admin_creds";

export interface ISiteContent extends Document {
  type: SiteContentType;
  content?: string;
  links?: SocialLink[];
  items?: PointItem[] | TermItem[];
  order?: number;
  question?: string;
  answer?: string;
  email?: string;
  password?: string;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SocialLinkSchema = new Schema<SocialLink>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const SiteContentSchema = new Schema<ISiteContent>(
  {
    type: {
      type: String,
      required: true,
      enum: ["about", "points", "terms", "faq", "admin_creds"],
    },
    content: {
      type: String,
    },
    links: {
      type: [SocialLinkSchema],
    },
    items: {
      type: [Schema.Types.Mixed],
    },
    order: {
      type: Number,
    },
    question: {
      type: String,
      trim: true,
    },
    answer: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin"],
    },
  },
  {
    timestamps: true,
  }
);

SiteContentSchema.index({ type: 1 });
SiteContentSchema.index(
  { type: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "admin_creds", email: { $exists: true } },
  }
);
SiteContentSchema.index({ type: 1, order: 1 });
// Unique constraint for single-document types (about, points, terms)
// Only one document per type for these content types
SiteContentSchema.index(
  { type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: { $in: ["about", "points", "terms"] } },
    name: "type_unique_about_points_terms",
  }
);

SiteContentSchema.pre("save", function (next) {
  const doc = this as any;
  const type = doc.type;

  // Always lowercase email for admin_creds type
  if (type === "admin_creds" && doc.email) {
    doc.email = doc.email.toLowerCase().trim();
  }

  // Set irrelevant fields to undefined so they won't be saved
  if (type === "about") {
    doc.items = undefined;
    doc.order = undefined;
    doc.question = undefined;
    doc.answer = undefined;
    doc.email = undefined;
    doc.password = undefined;
    doc.role = undefined;
  } else if (type === "points" || type === "terms") {
    doc.links = undefined;
    doc.order = undefined;
    doc.question = undefined;
    doc.answer = undefined;
    doc.email = undefined;
    doc.password = undefined;
    doc.role = undefined;
  } else if (type === "faq") {
    doc.content = undefined;
    doc.links = undefined;
    doc.items = undefined;
    doc.email = undefined;
    doc.password = undefined;
    doc.role = undefined;
  } else if (type === "admin_creds") {
    doc.content = undefined;
    doc.links = undefined;
    doc.items = undefined;
    doc.order = undefined;
    doc.question = undefined;
    doc.answer = undefined;
  }

  next();
});

SiteContentSchema.set("toJSON", {
  transform: function (_doc, ret) {
    const result = ret as any;

    // Always remove __v
    delete result.__v;

    const type = result.type;

    if (type === "about") {
      delete result.items;
      delete result.order;
      delete result.question;
      delete result.answer;
      delete result.email;
      delete result.password;
      delete result.role;
    } else if (type === "points" || type === "terms") {
      delete result.links;
      delete result.order;
      delete result.question;
      delete result.answer;
      delete result.email;
      delete result.password;
      delete result.role;
    } else if (type === "faq") {
      delete result.content;
      delete result.links;
      delete result.items;
      delete result.email;
      delete result.password;
      delete result.role;
    } else if (type === "admin_creds") {
      delete result.content;
      delete result.links;
      delete result.items;
      delete result.order;
      delete result.question;
      delete result.answer;
      delete result.password;
    }

    return result;
  },
});

export const SiteContent = mongoose.model<ISiteContent>("SiteContent", SiteContentSchema);

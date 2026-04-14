import logger from "./logger.js";
import { SiteContent } from "modules/site-content/models/SiteContent.model.js";
import { hashPassword } from "modules/admin/utils/passwordHash.js";
import { Team } from "modules/teams/models/Team.model.js";

const DEFAULT_ADMIN_EMAIL = "admin@ok11.in".toLowerCase();
const DEFAULT_ADMIN_PASSWORD = "admin123";

const DEFAULT_ABOUT_CONTENT = `
<h1>About OK11</h1>
<p>Welcome to OK11, your premier destination for cricket prediction and engagement!</p>
<p>OK11 is a cutting-edge platform designed for cricket enthusiasts who love to test their knowledge and prediction skills. Whether you're a casual fan or a cricket expert, OK11 offers an exciting way to engage with the sport you love.</p>
<p>Our platform enables you to make predictions on match outcomes, participate in skill-based quizzes, compete with fellow cricket fans, and earn points based on your accuracy and knowledge. Join thousands of cricket lovers who are already part of the OK11 community!</p>
`;

const DEFAULT_TERMS_CONTENT = `
<h1>Terms and Conditions</h1>
<p>Please read these terms and conditions carefully before using OK11. By accessing or using our platform, you agree to be bound by these terms.</p>
<p>These terms govern your use of OK11's services, including predictions, quizzes, and point systems. Your continued use of the platform constitutes acceptance of these terms.</p>
`;

const DEFAULT_POINTS_CONTENT = `
<h1>Skill Based Point System</h1>
<p>OK11 uses a comprehensive skill-based point system that rewards your cricket knowledge and prediction accuracy. Points are awarded based on various factors including the difficulty of predictions, accuracy of your selections, and performance in quizzes.</p>
<p>Your total points reflect your expertise and engagement level on the platform. Climb the leaderboard by making accurate predictions and demonstrating your cricket knowledge!</p>
`;

const DEFAULT_ABOUT_LINKS = [
  { title: "Website", url: "https://ok11.in" },
  { title: "Facebook", url: "https://facebook.com/ok11" },
  { title: "Twitter", url: "https://twitter.com/ok11" },
  { title: "Instagram", url: "https://instagram.com/ok11" },
];

const DEFAULT_POINTS_ITEMS = [
  {
    title: "Match Predictions",
    description:
      "Earn points by accurately predicting match outcomes, player performances, and key match events. Points vary based on prediction difficulty and accuracy.",
  },
  {
    title: "Quiz Participation",
    description:
      "Answer quiz questions correctly to accumulate points. Each quiz question has specific point values based on difficulty and relevance.",
  },
  {
    title: "Player Selection",
    description:
      "Select the right players for matches and earn points when your selections perform well. More accurate selections result in higher point rewards.",
  },
  {
    title: "Consistency Bonus",
    description:
      "Maintain consistent performance across multiple predictions and quizzes to earn bonus points. Regular participation is rewarded!",
  },
];

const DEFAULT_TERMS_ITEMS = [
  {
    title: "Age Requirement",
    description:
      "You must be at least 18 years old to participate in OK11. By using our platform, you confirm that you meet this age requirement.",
  },
  {
    title: "Account Responsibility",
    description:
      "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
  },
  {
    title: "Prediction Finality",
    description:
      "All predictions are final once submitted. You cannot modify or cancel predictions after the submission deadline. Please review carefully before submitting.",
  },
  {
    title: "Point System",
    description:
      "Points are awarded based on correct predictions and quiz answers. Point calculations are final and non-negotiable. OK11 reserves the right to adjust point systems with prior notice.",
  },
  {
    title: "Fair Play",
    description:
      "Any attempt to manipulate the system, use automated tools, or engage in fraudulent activities will result in immediate account suspension and point forfeiture.",
  },
  {
    title: "Content Usage",
    description:
      "All content on OK11, including predictions, quizzes, and platform features, is for personal use only. Commercial use or redistribution is prohibited.",
  },
  {
    title: "Privacy and Data",
    description:
      "Your personal information and prediction data are protected according to our Privacy Policy. We use your data to improve platform services and personalize your experience.",
  },
  {
    title: "Platform Availability",
    description:
      "OK11 strives for 24/7 availability but does not guarantee uninterrupted service. We are not liable for any losses due to platform downtime or technical issues.",
  },
];

const DEFAULT_FAQS = [
  {
    order: 1,
    question: "What is OK11?",
    answer:
      "OK11 is a cricket prediction and engagement platform where you can make match predictions, participate in quizzes, and compete with other cricket enthusiasts to earn points based on your knowledge and accuracy.",
  },
  {
    order: 2,
    question: "How do I earn points?",
    answer:
      "You earn points by making accurate match predictions, correctly answering quiz questions, and selecting the right players. Points are awarded based on the difficulty and accuracy of your predictions.",
  },
  {
    order: 3,
    question: "Can I change my prediction after submitting?",
    answer:
      "No, all predictions are final once submitted. You cannot modify or cancel predictions after the submission deadline. Please review your selections carefully before submitting.",
  },
  {
    order: 4,
    question: "How are points calculated?",
    answer:
      "Points are calculated based on various factors including prediction accuracy, difficulty level, and quiz performance. The exact calculation method may vary for different types of predictions and quizzes.",
  },
  {
    order: 5,
    question: "Is there an age requirement?",
    answer:
      "Yes, you must be at least 18 years old to participate in OK11. By using our platform, you confirm that you meet this age requirement.",
  },
  {
    order: 6,
    question: "What happens if I forget my password?",
    answer:
      "You can reset your password using the 'Forgot Password' feature on the login page. You will receive a password reset link via email to create a new password.",
  },
  {
    order: 7,
    question: "Can I participate in multiple predictions?",
    answer:
      "Yes, you can participate in multiple predictions and quizzes. There is no limit to the number of predictions you can make, as long as they are submitted before their respective deadlines.",
  },
  {
    order: 8,
    question: "How do I view my points and rankings?",
    answer:
      "You can view your total points, recent predictions, and leaderboard rankings in your profile section. The leaderboard is updated regularly to reflect current standings.",
  },
];

/**
 * Initialize database with default data
 * - Creates default admin user if none exists
 * - Creates default site content if none exists
 * - Creates all database indexes
 */
export async function initDatabase(): Promise<void> {
  try {
    logger.info("🔧 Initializing database...");

    // Initialize default admin
    await initializeDefaultAdmin();

    // Initialize default site content
    await initializeDefaultSiteContent();

    // World teams initialization removed - teams are now created via UI with image uploads

    // Create all indexes
    await createIndexes();

    logger.info("✅ Database initialization completed successfully");
  } catch (error) {
    logger.error({ err: error }, "❌ Database initialization failed");
    throw error;
  }
}

/**
 * Create default admin user if none exists
 * Also ensures existing admin has a valid password
 */
async function initializeDefaultAdmin(): Promise<void> {
  try {
    const existingAdmin = await SiteContent.findOne({
      type: "admin_creds",
      email: DEFAULT_ADMIN_EMAIL,
    });

    if (!existingAdmin) {
      logger.info("👤 No admin users found, creating default admin...");

      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
      const hashedPassword = await hashPassword(adminPassword);

      try {
        await SiteContent.create({
          type: "admin_creds",
          email: DEFAULT_ADMIN_EMAIL,
          password: hashedPassword,
          role: "admin",
        });

        logger.info(`✅ Default admin created (email: ${DEFAULT_ADMIN_EMAIL})`);
        if (!process.env.DEFAULT_ADMIN_PASSWORD) {
          logger.warn(
            `⚠️  Using default password. Set DEFAULT_ADMIN_PASSWORD in .env for production!`
          );
        }
      } catch (createError: any) {
        if (createError.code === 11000) {
          logger.info(`✓ Admin already exists (duplicate key error caught)`);
        } else {
          throw createError;
        }
      }
    } else {
      // Admin exists - ensure password is set correctly
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

      if (!existingAdmin.password) {
        logger.info("🔑 Admin exists but has no password, setting default password...");
        const hashedPassword = await hashPassword(adminPassword);
        await SiteContent.findOneAndUpdate(
          { _id: existingAdmin._id },
          { $set: { password: hashedPassword } }
        );
        logger.info(`✅ Admin password set (email: ${DEFAULT_ADMIN_EMAIL})`);
      } else {
        // Always reset password to ensure it matches DEFAULT_ADMIN_PASSWORD
        // This ensures login works even if password was changed manually
        logger.info("🔑 Resetting admin password to default...");
        const hashedPassword = await hashPassword(adminPassword);
        await SiteContent.findOneAndUpdate(
          { _id: existingAdmin._id },
          { $set: { password: hashedPassword, email: DEFAULT_ADMIN_EMAIL.toLowerCase() } }
        );
        logger.info(`✅ Admin password reset (email: ${DEFAULT_ADMIN_EMAIL})`);
      }

      const adminCount = await SiteContent.countDocuments({ type: "admin_creds" });
      logger.info(`✓ Admin users already exist (count: ${adminCount})`);
    }
  } catch (error) {
    logger.error({ err: error }, "❌ Failed to initialize default admin");
    throw error;
  }
}

/**
 * Create default site content if none exists (about, points, terms, faq)
 * Ensures only one document per type exists for single-document types
 * Creates default FAQs if none exist
 */
async function initializeDefaultSiteContent(): Promise<void> {
  try {
    await initializeAboutContent();
    await initializePointsContent();
    await initializeTermsContent();
    await initializeFAQContent();
  } catch (error) {
    logger.error({ err: error }, "❌ Failed to initialize default site content");
    throw error;
  }
}

async function initializeAboutContent(): Promise<void> {
  try {
    const aboutDocs = await SiteContent.find({ type: "about" }).sort({ createdAt: 1 });

    if (aboutDocs.length > 1) {
      const idsToDelete = aboutDocs.slice(1).map((doc) => doc._id);
      await SiteContent.deleteMany({ _id: { $in: idsToDelete } });
      logger.info(`🗑️  Removed ${idsToDelete.length} duplicate about documents`);
    }

    const existingAbout = await SiteContent.findOne({ type: "about" });

    if (!existingAbout) {
      await SiteContent.create({
        type: "about",
        content: DEFAULT_ABOUT_CONTENT,
        links: DEFAULT_ABOUT_LINKS,
      });
      logger.info("✓ About content created with default content and links");
    } else {
      if (!existingAbout.content || existingAbout.content.trim() === "") {
        await SiteContent.findOneAndUpdate(
          { type: "about" },
          { $set: { content: DEFAULT_ABOUT_CONTENT } }
        );
        logger.info("✓ About content updated with default content");
      }
      if (!existingAbout.links || existingAbout.links.length === 0) {
        await SiteContent.findOneAndUpdate(
          { type: "about" },
          { $set: { links: DEFAULT_ABOUT_LINKS } }
        );
        logger.info("✓ About links updated with default links");
      }
    }
  } catch (error) {
    logger.error({ err: error }, "❌ Failed to initialize about content");
    throw error;
  }
}

async function initializePointsContent(): Promise<void> {
  try {
    const pointsDocs = await SiteContent.find({ type: "points" }).sort({ createdAt: 1 });

    if (pointsDocs.length > 1) {
      const idsToDelete = pointsDocs.slice(1).map((doc) => doc._id);
      await SiteContent.deleteMany({ _id: { $in: idsToDelete } });
      logger.info(`🗑️  Removed ${idsToDelete.length} duplicate points documents`);
    }

    const existingPoints = await SiteContent.findOne({ type: "points" });

    if (!existingPoints) {
      await SiteContent.create({
        type: "points",
        content: DEFAULT_POINTS_CONTENT,
        items: DEFAULT_POINTS_ITEMS,
      });
      logger.info("✓ Points content created with default content and items");
    } else {
      if (!existingPoints.content || existingPoints.content.trim() === "") {
        await SiteContent.findOneAndUpdate(
          { type: "points" },
          { $set: { content: DEFAULT_POINTS_CONTENT } }
        );
        logger.info("✓ Points content updated with default content");
      }
      if (!existingPoints.items || existingPoints.items.length === 0) {
        await SiteContent.findOneAndUpdate(
          { type: "points" },
          { $set: { items: DEFAULT_POINTS_ITEMS } }
        );
        logger.info("✓ Points items updated with default items");
      }
    }
  } catch (error) {
    logger.error({ err: error }, "❌ Failed to initialize points content");
    throw error;
  }
}

async function initializeTermsContent(): Promise<void> {
  try {
    const termsDocs = await SiteContent.find({ type: "terms" }).sort({ createdAt: 1 });

    if (termsDocs.length > 1) {
      const idsToDelete = termsDocs.slice(1).map((doc) => doc._id);
      await SiteContent.deleteMany({ _id: { $in: idsToDelete } });
      logger.info(`🗑️  Removed ${idsToDelete.length} duplicate terms documents`);
    }

    const existingTerms = await SiteContent.findOne({ type: "terms" });

    if (!existingTerms) {
      await SiteContent.create({
        type: "terms",
        content: DEFAULT_TERMS_CONTENT,
        items: DEFAULT_TERMS_ITEMS,
      });
      logger.info("✓ Terms content created with default content and items");
    } else {
      if (!existingTerms.content || existingTerms.content.trim() === "") {
        await SiteContent.findOneAndUpdate(
          { type: "terms" },
          { $set: { content: DEFAULT_TERMS_CONTENT } }
        );
        logger.info("✓ Terms content updated with default content");
      }
      if (!existingTerms.items || existingTerms.items.length === 0) {
        await SiteContent.findOneAndUpdate(
          { type: "terms" },
          { $set: { items: DEFAULT_TERMS_ITEMS } }
        );
        logger.info("✓ Terms items updated with default items");
      }
    }
  } catch (error) {
    logger.error({ err: error }, "❌ Failed to initialize terms content");
    throw error;
  }
}

async function initializeFAQContent(): Promise<void> {
  try {
    const existingFAQs = await SiteContent.find({ type: "faq" }).sort({ order: 1 });

    if (existingFAQs.length === 0) {
      const faqDocuments = DEFAULT_FAQS.map((faq) => ({
        type: "faq" as const,
        order: faq.order,
        question: faq.question,
        answer: faq.answer,
      }));

      await SiteContent.insertMany(faqDocuments);
      logger.info(`✓ Created ${DEFAULT_FAQS.length} default FAQ documents`);
    } else {
      logger.info(`✓ FAQs already exist (count: ${existingFAQs.length})`);
    }
  } catch (error) {
    logger.error({ err: error }, "❌ Failed to initialize FAQ content");
    throw error;
  }
}

/**
 * Create all database indexes
 */
async function createIndexes(): Promise<void> {
  try {
    logger.info("📇 Creating database indexes...");

    // Drop old index if it exists (sparse index conflict)

    // Create indexes for unified SiteContent model
    await SiteContent.createIndexes();
    logger.info("✓ SiteContent indexes created");

    // Create indexes for Team model
    await Team.createIndexes();
    logger.info("✓ Team indexes created");

    logger.info("✅ All database indexes created successfully");
  } catch (error) {
    logger.error({ err: error }, "❌ Failed to create database indexes");
    throw error;
  }
}

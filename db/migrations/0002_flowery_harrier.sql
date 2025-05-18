CREATE TYPE "public"."membership_enum" AS ENUM('starter', 'plus', 'pro', 'business');--> statement-breakpoint
-- ALTER TABLE "profiles" ALTER COLUMN "user_id" SET DATA TYPE varchar(191);--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "membership" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "membership" SET DATA TYPE "public"."membership_enum"
USING CASE "membership"::text
    WHEN 'free' THEN 'starter'::"public"."membership_enum"
    WHEN 'pro' THEN 'pro'::"public"."membership_enum"
    ELSE 'starter'::"public"."membership_enum" -- Fallback for any other unexpected old values
END;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "membership" SET DEFAULT 'starter';--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "membership" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "username" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "stripe_price_id" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "seat_count" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_stripe_customer_id_unique" UNIQUE("stripe_customer_id");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id");--> statement-breakpoint
DROP TYPE "public"."membership";
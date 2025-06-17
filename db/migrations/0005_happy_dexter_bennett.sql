CREATE TABLE "search_origins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"search_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"address" text NOT NULL,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"display_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "searches" ALTER COLUMN "start_location_address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "searches" ALTER COLUMN "start_location_lat" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "searches" ALTER COLUMN "start_location_lng" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "searches" ALTER COLUMN "end_location_address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "searches" ALTER COLUMN "end_location_lat" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "searches" ALTER COLUMN "end_location_lng" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "searches" ALTER COLUMN "midpoint_lat" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "searches" ALTER COLUMN "midpoint_lng" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "searches" ADD COLUMN "origin_count" integer DEFAULT 2;--> statement-breakpoint
ALTER TABLE "searches" ADD COLUMN "search_metadata" json;--> statement-breakpoint
ALTER TABLE "search_origins" ADD CONSTRAINT "search_origins_search_id_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."searches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "search_origins_search_id_idx" ON "search_origins" USING btree ("search_id");--> statement-breakpoint
CREATE INDEX "search_origins_order_idx" ON "search_origins" USING btree ("search_id","order_index");
CREATE TABLE IF NOT EXISTS "pingdom_logs" (
	"id" varchar(200) PRIMARY KEY NOT NULL,
	"id_user" varchar(191),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"action" varchar(5000) NOT NULL,
	"error_level" text DEFAULT 'info' NOT NULL,
	"description" varchar(5000) NOT NULL,
	"affected_entity" varchar(191)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pingdom_pings" (
	"id_ping" varchar(200) PRIMARY KEY NOT NULL,
	"times" double precision NOT NULL,
	"packet_loss" double precision NOT NULL,
	"min" double precision NOT NULL,
	"max" double precision NOT NULL,
	"avg" double precision NOT NULL,
	"log" varchar(191) NOT NULL,
	"is_alive" smallint NOT NULL,
	"numeric_host" varchar(191) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id_server" varchar(200) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pingdom_servers" (
	"id_server" varchar(200) PRIMARY KEY NOT NULL,
	"name" varchar(191) NOT NULL,
	"url" varchar(191),
	"ip" varchar(191),
	"description" varchar(191),
	"title" varchar(191) NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"worker_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"id_user" varchar(200) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pingdom_tasks" (
	"id_task" varchar(200) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"id_job" varchar(300) NOT NULL,
	"log" varchar(500) NOT NULL,
	"type" text DEFAULT 'undefined' NOT NULL,
	"cron" varchar(191) NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"id_server" varchar(200),
	"retries_failed" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pingdom_users" (
	"id_user" varchar(200) PRIMARY KEY NOT NULL,
	"name" varchar(191) NOT NULL,
	"last_name" varchar(191) NOT NULL,
	"email" varchar(191) NOT NULL,
	"password" varchar(191) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	CONSTRAINT "pingdom_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pingdom_pings" ADD CONSTRAINT "pingdom_pings_id_server_pingdom_servers_id_server_fk" FOREIGN KEY ("id_server") REFERENCES "public"."pingdom_servers"("id_server") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pingdom_servers" ADD CONSTRAINT "pingdom_servers_id_user_pingdom_users_id_user_fk" FOREIGN KEY ("id_user") REFERENCES "public"."pingdom_users"("id_user") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pingdom_tasks" ADD CONSTRAINT "pingdom_tasks_id_server_pingdom_servers_id_server_fk" FOREIGN KEY ("id_server") REFERENCES "public"."pingdom_servers"("id_server") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

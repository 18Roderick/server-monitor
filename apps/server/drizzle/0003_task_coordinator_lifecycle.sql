ALTER TABLE "pingdom_tasks" DROP CONSTRAINT IF EXISTS "pingdom_tasks_id_server_pingdom_servers_id_server_fk";--> statement-breakpoint
ALTER TABLE "pingdom_tasks" ADD CONSTRAINT "pingdom_tasks_id_server_pingdom_servers_id_server_fk" FOREIGN KEY ("id_server") REFERENCES "public"."pingdom_servers"("id_server") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pingdom_tasks" ADD CONSTRAINT "pingdom_tasks_id_server_unique" UNIQUE("id_server");

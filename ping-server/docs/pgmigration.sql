CREATE TYPE error_level AS ENUM ('info', 'warning', 'error', 'critical');
CREATE TYPE status_type AS ENUM ('active', 'inactive');
CREATE TYPE worker_type AS ENUM ('server', 'url');
CREATE TYPE task_type AS ENUM ('undefined', 'server', 'background', 'summary', 'admin', 'daily');
CREATE TYPE task_status AS ENUM ('running', 'stopped', 'deleted', 'waiting');

CREATE TABLE "logs" (
	"id" SERIAL PRIMARY KEY,
	"id_user" VARCHAR(191),
	"updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"action" VARCHAR(5000) NOT NULL,
	"error_level" error_level NOT NULL DEFAULT 'info',
	"description" VARCHAR(5000) NOT NULL,
	"affected_entity" VARCHAR(191)
);

CREATE TABLE "pings" (
	"id_ping" VARCHAR(200) PRIMARY KEY,
	"times" DOUBLE PRECISION NOT NULL,
	"packet_loss" DOUBLE PRECISION NOT NULL,
	"min" DOUBLE PRECISION NOT NULL,
	"max" DOUBLE PRECISION NOT NULL,
	"avg" DOUBLE PRECISION NOT NULL,
	"log" VARCHAR(191) NOT NULL,
	"is_alive" SMALLINT NOT NULL,
	"numeric_host" VARCHAR(191) NOT NULL,
	"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"id_server" VARCHAR(200) NOT NULL
);

CREATE TABLE "servers" (
	"id_server" VARCHAR(200) PRIMARY KEY,
	"url" VARCHAR(191),
	"ip" VARCHAR(191),
	"description" VARCHAR(191),
	"title" VARCHAR(191) NOT NULL,
	"status" status_type NOT NULL DEFAULT 'active',
	"worker_type" worker_type NOT NULL,
	"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"id_user" VARCHAR(200) NOT NULL
);

CREATE TABLE "tasks" (
	"id_task" VARCHAR(200) PRIMARY KEY,
	"id_job" VARCHAR(300) NOT NULL,
	"log" VARCHAR(500) NOT NULL,
	"type" task_type NOT NULL DEFAULT 'undefined',
	"cron" VARCHAR(191) NOT NULL,
	"status" task_status NOT NULL DEFAULT 'running',
	"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"id_server" VARCHAR(200),
	"retries_failed" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "users" (
	"id_user" VARCHAR(200) PRIMARY KEY,
	"name" VARCHAR(191) NOT NULL,
	"last_name" VARCHAR(191) NOT NULL,
	"email" VARCHAR(191) NOT NULL UNIQUE,
	"password" VARCHAR(191) NOT NULL,
	"updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"status" status_type NOT NULL DEFAULT 'active'
);

ALTER TABLE "pings" ADD CONSTRAINT "pings_id_server_fk" FOREIGN KEY ("id_server") REFERENCES "servers"("id_server") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "servers" ADD CONSTRAINT "servers_id_user_fk" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_id_server_fk" FOREIGN KEY ("id_server") REFERENCES "servers"("id_server") ON DELETE CASCADE ON UPDATE CASCADE;

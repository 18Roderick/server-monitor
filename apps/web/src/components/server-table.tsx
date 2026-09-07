import { useState } from "react";

import type { ServerSummary } from "@/api/servers";
import { EditServerDialog } from "@/components/server-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Link } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";

const statusVariant = (status: string) => {
	switch (status.toLowerCase()) {
		case "active":
			return "success" as const;
		case "inactive":
			return "destructive" as const;
		default:
			return "outline" as const;
	}
};

export default function ServerTable({
	data,
	onDelete,
}: {
	data: ServerSummary[];
	onDelete?: (id: string) => void;
}) {
	const [editing, setEditing] = useState<ServerSummary | null>(null);

	return (
		<>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Host</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Latency (avg)</TableHead>
						<TableHead>Latency (min / max)</TableHead>
						<TableHead>
							<span className="sr-only">Actions</span>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.map((server) => (
						<TableRow key={server.idServer}>
							<TableCell>
								<Link
									to="/servers/$serverId"
									params={{ serverId: String(server.idServer) }}
									className="font-medium hover:text-accent"
								>
									{server.title}
								</Link>
								{(server.ip || server.url) && (
									<div className="text-xs text-muted-foreground">
										{server.ip ?? server.url}
									</div>
								)}
							</TableCell>
							<TableCell>
								<Badge variant={statusVariant(server.status)}>
									{server.status}
								</Badge>
							</TableCell>
							<TableCell className="font-display">
								{server.ping_avg != null ? `${server.ping_avg}ms` : "—"}
							</TableCell>
							<TableCell className="font-display">
								{server.ping_min != null && server.ping_max != null
									? `${server.ping_min}ms / ${server.ping_max}ms`
									: "—"}
							</TableCell>
							<TableCell className="flex items-center gap-1">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setEditing(server)}
								>
									<Pencil className="h-4 w-4" />
									<span className="sr-only">Edit {server.title}</span>
								</Button>
								{onDelete && (
									<Button
										variant="ghost"
										size="icon"
										onClick={() => onDelete(String(server.idServer))}
									>
										<Trash2 className="h-4 w-4" />
										<span className="sr-only">Delete {server.title}</span>
									</Button>
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			{editing && (
				<EditServerDialog
					server={editing}
					open={!!editing}
					onOpenChange={(open) => {
						if (!open) setEditing(null);
					}}
				/>
			)}
		</>
	);
}

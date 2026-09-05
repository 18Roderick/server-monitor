import type { Server } from "@/api/servers";
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
import { Trash2 } from "lucide-react";

const statusVariant = (status: string) => {
	switch (status.toLowerCase()) {
		case "up":
			return "success" as const;
		case "degraded":
			return "warning" as const;
		case "down":
			return "destructive" as const;
		default:
			return "outline" as const;
	}
};

export default function ServerTable({
	data,
	onDelete,
}: {
	data: Server[];
	onDelete?: (id: string) => void;
}) {
	return (
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
								params={{ serverId: server.idServer }}
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
						<TableCell>
							{onDelete && (
								<Button
									variant="ghost"
									size="icon"
									onClick={() => onDelete(server.idServer)}
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
	);
}

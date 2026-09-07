import { useMemo, useState } from "react";
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
	type ColumnDef,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import type { PingEntity } from "@/api/pings";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { pingHistoryQueryOptions, type PingRange } from "@/querys/pings";

const RANGE_OPTIONS: { value: PingRange; label: string }[] = [
	{ value: "24h", label: "Últimas 24h" },
	{ value: "7d", label: "7 días" },
	{ value: "30d", label: "30 días" },
];

const columns: ColumnDef<PingEntity>[] = [
	{
		accessorKey: "created_at",
		header: "Fecha",
		cell: ({ getValue }) =>
			format(new Date(getValue<string>()), "dd/MM/yyyy HH:mm:ss", {
				locale: es,
			}),
	},
	{
		accessorKey: "is_alive",
		header: "Estado",
		cell: ({ getValue }) =>
			getValue<0 | 1>() === 1 ? (
				<Badge variant="success">Activo</Badge>
			) : (
				<Badge variant="destructive">Caído</Badge>
			),
	},
	{
		accessorKey: "avg",
		header: "Latencia (avg)",
		cell: ({ getValue }) => `${getValue<number>()}ms`,
	},
	{
		id: "minMax",
		header: "Latencia (min / max)",
		cell: ({ row }) => `${row.original.min}ms / ${row.original.max}ms`,
	},
	{
		accessorKey: "packet_loss",
		header: "Pérdida de paquetes",
		cell: ({ getValue }) => `${getValue<number>()}%`,
	},
];

export default function PingHistoryTable({ serverId }: { serverId: string }) {
	const [range, setRange] = useState<PingRange>("24h");

	const { data, isLoading } = useQuery(
		pingHistoryQueryOptions(serverId, range),
	);

	const rows = useMemo(() => data ?? [], [data]);

	const table = useReactTable({
		data: rows,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="mt-8">
			<div className="flex items-center justify-between">
				<h2 className="font-display text-lg">Historial de pings</h2>
				<Select
					value={range}
					onValueChange={(value) => setRange(value as PingRange)}
				>
					<SelectTrigger className="w-40">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{RANGE_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="mt-4 border-2 border-border">
				{isLoading ? (
					<p className="p-6 text-center text-sm text-muted-foreground">
						Cargando...
					</p>
				) : rows.length === 0 ? (
					<p className="p-6 text-center text-sm text-muted-foreground">
						No hay pings registrados en este rango.
					</p>
				) : (
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>
		</div>
	);
}

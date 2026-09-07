import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import {
	createServer,
	updateServer,
	type CreateServerInput,
	type ServerSummary,
	type UpdateServerInput,
} from "@/api/servers";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const URL_PATTERN = /^https?:\/\/[^\s]+$/;
const IP_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/;

const formSchema = z
	.object({
		mode: z.enum(["url", "ip"]),
		url: z.string().optional(),
		ip: z.string().optional(),
		title: z.string().min(1, "El título es obligatorio"),
		description: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (data.mode === "url") {
			if (!data.url || !URL_PATTERN.test(data.url)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["url"],
					message: "Debe ser una URL válida (http:// o https://)",
				});
			}
		} else {
			if (!data.ip || !IP_PATTERN.test(data.ip)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["ip"],
					message: "Debe ser una dirección IP válida",
				});
			}
		}
	});

type ServerFormValues = z.infer<typeof formSchema>;

function serverMode(server: Pick<ServerSummary, "ip" | "url">): "url" | "ip" {
	return server.ip ? "ip" : "url";
}

function AddressField({
	control,
	mode,
}: {
	control: ReturnType<typeof useForm<ServerFormValues>>["control"];
	mode: "url" | "ip";
}) {
	return mode === "url" ? (
		<FormField
			control={control}
			name="url"
			render={({ field }) => (
				<FormItem>
					<FormLabel>URL</FormLabel>
					<FormControl>
						<Input placeholder="https://ejemplo.com" {...field} />
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	) : (
		<FormField
			control={control}
			name="ip"
			render={({ field }) => (
				<FormItem>
					<FormLabel>Dirección IP</FormLabel>
					<FormControl>
						<Input placeholder="192.168.1.1" {...field} />
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

export function AddServerDialog() {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const form = useForm<ServerFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			mode: "url",
			url: "",
			ip: "",
			title: "",
			description: "",
		},
	});

	const mode = form.watch("mode");

	const mutation = useMutation({
		mutationFn: createServer,
		onSuccess: () => {
			toast("Servidor agregado correctamente");
			void queryClient.invalidateQueries({ queryKey: ["servers"] });
			setOpen(false);
			form.reset();
		},
		onError: (error: unknown) => {
			const message = axios.isAxiosError(error)
				? (error.response?.data?.message ?? "No se pudo agregar el servidor")
				: "No se pudo agregar el servidor";
			toast.error(message);
		},
	});

	const onSubmit = (values: ServerFormValues) => {
		const payload: CreateServerInput =
			values.mode === "url"
				? {
						mode: "url",
						url: values.url ?? "",
						title: values.title,
						description: values.description || undefined,
					}
				: {
						mode: "ip",
						ip: values.ip ?? "",
						title: values.title,
						description: values.description || undefined,
					};
		mutation.mutate(payload);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (!next) form.reset();
			}}
		>
			<DialogTrigger asChild>
				<Button className="gap-2">
					<Plus className="h-4 w-4" />
					Agregar servidor
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Agregar servidor</DialogTitle>
					<DialogDescription>
						Registra un nuevo servidor para monitorear su disponibilidad.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="mode"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Modo de monitoreo</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="url">Monitorear por URL</SelectItem>
											<SelectItem value="ip">Monitorear por IP</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<AddressField control={form.control} mode={mode} />

						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Título</FormLabel>
									<FormControl>
										<Input placeholder="Servidor de producción" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Descripción (opcional)</FormLabel>
									<FormControl>
										<Textarea placeholder="Notas adicionales" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="submit"
								disabled={mutation.isPending}
								className="gap-2"
							>
								Agregar servidor
								{mutation.isPending ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : null}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

const MODE_LABEL: Record<"url" | "ip", string> = {
	url: "Monitoreando por URL",
	ip: "Monitoreando por IP",
};

export function EditServerDialog({
	server,
	open,
	onOpenChange,
}: {
	server: ServerSummary;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const queryClient = useQueryClient();
	const mode = serverMode(server);

	const form = useForm<ServerFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			mode,
			url: server.url ?? "",
			ip: server.ip ?? "",
			title: server.title,
			description: "",
		},
	});

	// Re-sync the form whenever a different server is opened for editing.
	useEffect(() => {
		if (open) {
			form.reset({
				mode,
				url: server.url ?? "",
				ip: server.ip ?? "",
				title: server.title,
				description: "",
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, server.idServer]);

	const mutation = useMutation({
		mutationFn: (dto: UpdateServerInput) =>
			updateServer(String(server.idServer), dto),
		onSuccess: () => {
			toast("Servidor actualizado correctamente");
			void queryClient.invalidateQueries({ queryKey: ["servers"] });
			onOpenChange(false);
		},
		onError: (error: unknown) => {
			const message = axios.isAxiosError(error)
				? (error.response?.data?.message ?? "No se pudo actualizar el servidor")
				: "No se pudo actualizar el servidor";
			toast.error(message);
		},
	});

	const onSubmit = (values: ServerFormValues) => {
		const payload: UpdateServerInput =
			mode === "url"
				? {
						mode: "url",
						url: values.url,
						title: values.title,
						description: values.description || undefined,
					}
				: {
						mode: "ip",
						ip: values.ip,
						title: values.title,
						description: values.description || undefined,
					};
		mutation.mutate(payload);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Editar servidor</DialogTitle>
					<DialogDescription>{MODE_LABEL[mode]}</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<AddressField control={form.control} mode={mode} />

						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Título</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Descripción (opcional)</FormLabel>
									<FormControl>
										<Textarea placeholder="Notas adicionales" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="submit"
								disabled={mutation.isPending}
								className="gap-2"
							>
								Guardar cambios
								{mutation.isPending ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : null}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

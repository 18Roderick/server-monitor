import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { updateUser } from "@/api/user";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { decodeJwt } from "@/utils/jwt";

export const Route = createFileRoute("/settings/")({
	component: SettingsPage,
});

const formSchema = z.object({
	name: z
		.string()
		.min(4, "El nombre debe tener entre 4 y 255 caracteres")
		.max(255, "El nombre debe tener entre 4 y 255 caracteres"),
});

type SettingsFormValues = z.infer<typeof formSchema>;

function SettingsPage() {
	const { token } = useAuth();
	const userId = useMemo(() => decodeJwt(token)?.sub, [token]);

	const form = useForm<SettingsFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { name: "" },
	});

	const mutation = useMutation({
		mutationFn: (values: SettingsFormValues) => {
			if (!userId) throw new Error("No se pudo identificar al usuario");
			return updateUser(userId, values);
		},
		onSuccess: () => {
			toast("Perfil actualizado correctamente");
		},
		onError: (error: unknown) => {
			const message = axios.isAxiosError(error)
				? (error.response?.data?.message ?? "No se pudo actualizar el perfil")
				: "No se pudo actualizar el perfil";
			toast.error(message);
		},
	});

	const onSubmit = (values: SettingsFormValues) => mutation.mutate(values);

	return (
		<div className="mx-auto max-w-screen-sm p-6">
			<h1 className="font-display text-2xl">Ajustes</h1>

			<Card className="mt-6">
				<CardHeader>
					<CardTitle className="font-display text-xl">Perfil</CardTitle>
					<CardDescription>Actualiza tu nombre.</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nombre</FormLabel>
										<FormControl>
											<Input placeholder="Tu nombre" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

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
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}

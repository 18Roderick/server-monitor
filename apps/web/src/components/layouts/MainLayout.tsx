// biome-ignore lint/style/useImportType: <explanation>
import * as React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex flex-1 flex-col">
			<main className="flex flex-1 items-center justify-center p-6">
				{children}
			</main>
			<footer className="border-t-2 border-border p-4 text-center text-xs uppercase tracking-wide text-muted-foreground">
				Server Monitor
			</footer>
		</div>
	);
}

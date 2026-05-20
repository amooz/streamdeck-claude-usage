export type DataSource = "admin-api" | "local-logs";
export type DisplayMode = "text" | "ring" | "ring+text";

export type UsageButtonSettings = {
	source?: DataSource;
	metric?: string;
	displayMode?: DisplayMode;
};

export const DISPLAY_MODES: readonly DisplayMode[] = ["text", "ring", "ring+text"] as const;

export function isDisplayMode(value: unknown): value is DisplayMode {
	return typeof value === "string" && (DISPLAY_MODES as readonly string[]).includes(value);
}

import {
	action,
	SingletonAction,
	type DidReceiveSettingsEvent,
	type KeyAction,
	type WillAppearEvent,
	type WillDisappearEvent
} from "@elgato/streamdeck";

import { renderButton } from "../render/index.js";
import { bufferToDataUri } from "../render/text-renderer.js";
import { AdminApiSource } from "../sources/admin-api-source.js";
import { LocalLogsSource } from "../sources/local-logs-source.js";
import type { UsageSource } from "../sources/source.js";
import type { UsageSnapshot } from "../types.js";
import { Poller } from "../util/poller.js";
import {
	resolveSettings,
	toDisplayConfig,
	type ResolvedSettings,
	type UsageButtonSettings
} from "./usage-button-settings.js";

type Instance = {
	poller: Poller;
	settings: ResolvedSettings;
};

@action({ UUID: "dev.mooz.streamdeck.claude-usage.usage" })
export class UsageButton extends SingletonAction<UsageButtonSettings> {
	private readonly instances = new Map<string, Instance>();

	override onWillAppear(ev: WillAppearEvent<UsageButtonSettings>): Promise<void> {
		const settings = resolveSettings(ev.payload.settings);
		if (!ev.action.isKey()) return Promise.resolve();
		this.startInstance(ev.action.id, ev.action, settings);
		return Promise.resolve();
	}

	override onWillDisappear(ev: WillDisappearEvent<UsageButtonSettings>): Promise<void> {
		this.stopInstance(ev.action.id);
		return Promise.resolve();
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<UsageButtonSettings>): Promise<void> {
		const settings = resolveSettings(ev.payload.settings);
		if (!ev.action.isKey()) return Promise.resolve();
		this.stopInstance(ev.action.id);
		this.startInstance(ev.action.id, ev.action, settings);
		return Promise.resolve();
	}

	private startInstance(id: string, key: KeyAction<UsageButtonSettings>, settings: ResolvedSettings): void {
		const source = this.makeSource(settings);
		const tick = async (): Promise<void> => {
			const snapshot = await source.fetch();
			await this.paint(key, snapshot, settings);
		};
		const poller = new Poller(tick, {
			intervalMs: Math.max(1, settings.refreshSeconds) * 1000,
			onError: (err) => {
				void key.setTitle("ERR");
				console.error("[claude-usage] fetch failed:", err);
			}
		});
		this.instances.set(id, { poller, settings });
		poller.start();
	}

	private stopInstance(id: string): void {
		const inst = this.instances.get(id);
		if (!inst) return;
		inst.poller.stop();
		this.instances.delete(id);
	}

	private async paint(
		key: KeyAction<UsageButtonSettings>,
		snapshot: UsageSnapshot,
		settings: ResolvedSettings
	): Promise<void> {
		const display = toDisplayConfig(settings);
		const png = renderButton(snapshot, display);
		await key.setImage(bufferToDataUri(png));
		await key.setTitle("");
	}

	private makeSource(settings: ResolvedSettings): UsageSource {
		if (settings.source === "admin-api" && settings.adminApiKey) {
			return new AdminApiSource({ apiKey: settings.adminApiKey });
		}
		return new LocalLogsSource({
			project: settings.project,
			root: settings.projectsRoot ?? undefined
		});
	}
}

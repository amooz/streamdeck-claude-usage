import { action, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";

import type { UsageButtonSettings } from "./usage-button-settings.js";

@action({ UUID: "dev.mooz.streamdeck.claude-usage.usage" })
export class UsageButton extends SingletonAction<UsageButtonSettings> {
	override onWillAppear(ev: WillAppearEvent<UsageButtonSettings>): Promise<void> {
		return ev.action.setTitle("Claude");
	}
}

import streamDeck from "@elgato/streamdeck";

import { UsageButton } from "./actions/usage-button.js";

streamDeck.logger.setLevel("info");

streamDeck.actions.registerAction(new UsageButton());

streamDeck.connect();

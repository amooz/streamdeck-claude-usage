import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import type { UsageSnapshot } from "../types.js";
import { systemClock, type Clock } from "../util/clock.js";
import { buildSnapshot } from "./aggregator.js";
import { parseJsonlContents, type ParsedAssistantEntry } from "./jsonl-parser.js";
import { DEFAULT_PROJECTS_ROOT, listProjects } from "./projects.js";
import type { UsageSource } from "./source.js";

export type LocalLogsConfig = {
	root?: string;
	project?: string | null;
	clock?: Clock;
};

export class LocalLogsSource implements UsageSource {
	readonly id = "local-logs";
	private readonly root: string;
	private readonly project: string | null;
	private readonly clock: Clock;

	constructor(config: LocalLogsConfig = {}) {
		this.root = config.root ?? DEFAULT_PROJECTS_ROOT;
		this.project = config.project ?? null;
		this.clock = config.clock ?? systemClock;
	}

	async fetch(): Promise<UsageSnapshot> {
		const projectDirs = this.resolveProjectDirs();
		const entries: ParsedAssistantEntry[] = [];
		for (const dir of projectDirs) {
			for (const file of listJsonlFiles(dir)) {
				let contents: string;
				try {
					contents = readFileSync(file, "utf8");
				} catch {
					continue;
				}
				const parsed = parseJsonlContents(contents);
				for (const e of parsed) entries.push(e);
			}
		}
		return buildSnapshot(entries, this.clock.now());
	}

	listAvailableProjects(): string[] {
		return listProjects(this.root).map((p) => p.encodedName);
	}

	private resolveProjectDirs(): string[] {
		if (this.project === null || this.project === "" || this.project === "all") {
			return listProjects(this.root).map((p) => p.absoluteDir);
		}
		return [path.join(this.root, this.project)];
	}
}

function listJsonlFiles(dir: string): string[] {
	let names: string[];
	try {
		names = readdirSync(dir);
	} catch {
		return [];
	}
	const out: string[] = [];
	for (const name of names) {
		if (!name.endsWith(".jsonl")) continue;
		const full = path.join(dir, name);
		try {
			if (statSync(full).isFile()) out.push(full);
		} catch {
			// ignore
		}
	}
	return out;
}

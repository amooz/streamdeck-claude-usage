import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { decodeProjectName, listProjects } from "../../src/sources/projects.js";

describe("decodeProjectName", () => {
	it("recovers a path from a dash-encoded directory", () => {
		expect(decodeProjectName("-home-amooz-src-foo")).toBe("/home/amooz/src/foo");
	});

	it("leaves non-encoded names unchanged", () => {
		expect(decodeProjectName("regular-folder")).toBe("regular-folder");
	});
});

describe("listProjects", () => {
	let dir: string;

	beforeEach(() => {
		dir = mkdtempSync(path.join(tmpdir(), "scu-projects-"));
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	it("returns an empty list when the root does not exist", () => {
		expect(listProjects(path.join(dir, "no-such"))).toEqual([]);
	});

	it("lists encoded project directories sorted by display path", async () => {
		const { mkdirSync } = await import("node:fs");
		mkdirSync(path.join(dir, "-home-z-project"));
		mkdirSync(path.join(dir, "-home-a-project"));
		const out = listProjects(dir);
		expect(out.map((p) => p.displayPath)).toEqual(["/home/a/project", "/home/z/project"]);
		expect(out[0].encodedName).toBe("-home-a-project");
	});
});

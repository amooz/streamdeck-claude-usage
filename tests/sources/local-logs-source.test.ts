import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { LocalLogsSource } from "../../src/sources/local-logs-source.js";
import { fixedClock } from "../../src/util/clock.js";

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), "../fixtures/projects");

describe("LocalLogsSource (against fixtures)", () => {
	it("aggregates across all projects when no project is selected", async () => {
		const src = new LocalLogsSource({
			root: FIXTURES,
			project: null,
			clock: fixedClock("2030-01-01T00:00:00Z")
		});
		const snap = await src.fetch();
		expect(snap.estimated).toBe(true);
		expect(snap.allTime.total.requests).toBeGreaterThan(0);
		expect(snap.allTime.byModel.opus.requests).toBeGreaterThan(0);
	});

	it("scopes to a single project when one is named", async () => {
		const src = new LocalLogsSource({
			root: FIXTURES,
			project: "fixture-816",
			clock: fixedClock("2030-01-01T00:00:00Z")
		});
		const snap = await src.fetch();
		expect(snap.allTime.total.requests).toBeGreaterThan(0);

		const srcAll = new LocalLogsSource({ root: FIXTURES, clock: fixedClock("2030-01-01T00:00:00Z") });
		const snapAll = await srcAll.fetch();
		expect(snap.allTime.total.requests).toBeLessThan(snapAll.allTime.total.requests);
	});

	it("treats 'all' as a synonym for no project filter", async () => {
		const src = new LocalLogsSource({
			root: FIXTURES,
			project: "all",
			clock: fixedClock("2030-01-01T00:00:00Z")
		});
		const snap = await src.fetch();
		expect(snap.allTime.total.requests).toBeGreaterThan(0);
	});

	it("exposes available project encoded names", () => {
		const src = new LocalLogsSource({ root: FIXTURES });
		const names = src.listAvailableProjects();
		expect(names).toContain("fixture-816");
		expect(names).toContain("fixture-10006");
	});

	it("returns an empty snapshot when the root does not exist", async () => {
		const src = new LocalLogsSource({ root: path.join(FIXTURES, "no-such") });
		const snap = await src.fetch();
		expect(snap.allTime.total.requests).toBe(0);
	});

	it("attributes session5h correctly when 'now' falls inside a fixture's burst", async () => {
		// Fixture ca048266 has entries clustered around 2026-05-14T14:48Z and later.
		const src = new LocalLogsSource({
			root: FIXTURES,
			project: "fixture-816",
			clock: fixedClock("2026-05-14T15:30:00Z")
		});
		const snap = await src.fetch();
		expect(snap.session5h.total.requests).toBeGreaterThan(0);
		expect(snap.session5h.startedAt).not.toBeNull();
	});
});

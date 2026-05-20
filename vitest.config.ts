import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["tests/**/*.test.ts"],
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			exclude: [
				"src/**/*.d.ts",
				// SDK-decorated entry points are exercised in the Stream Deck app, not in unit tests.
				// They are thin shells over the SDK; logic lives in render/, sources/, util/ which are gated.
				"src/plugin.ts",
				"src/actions/usage-button.ts"
			],
			reporter: ["text", "html"],
			thresholds: {
				lines: 90,
				branches: 90,
				functions: 90,
				statements: 90
			}
		}
	}
});

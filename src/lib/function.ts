// export function assert(condition: true): void;
// export function assert(condition: false): never;
export function assert(condition: boolean, cause: string) {
	if (!condition) {
		throw new Error("Assertion failed", { cause });
	}
}

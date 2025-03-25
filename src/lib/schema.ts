import type { ObjectOptions, TObject } from "@sinclair/typebox"; // elysia also did not export these
import { type TSchema, t } from "elysia";
import type { TUnionEnum } from "elysia/type-system";

/**
 * This is almost the same as T.Union([first, second])
 * but if you do that on union enum then in the generated schema it will
 * results in something like
 * enum: {
 * 		anyOf: [
 * 			first,
 * 			second
 * 		]
 * }
 *
 * but what we want is
 * enum: {
 * 		anyOf: [
 * 			...first.allCases,
 * 			...second.allCases
 * 		]
 * }
 *
 * T.Union make the generated docs harder to navigate so i wrote this.
 */
export function mergeUnionEnum<
	T extends TUnionEnum<[string, ...string[]]>,
	S extends TUnionEnum<[string, ...string[]]>,
>(first: T, second: S) {
	return t.UnionEnum([...first.enum, ...second.enum]);
}

/**
 * Creates an API error response schema with success: false.
 * Utility to avoid repeatedly writing t.Object({ success: false, ... }).
 * @param errorEnum Error type enum that will be available under a property named `error`.
 * @param options Object options
 */
export function apiError<T extends TSchema>(
	errorEnum: T,
	options?: ObjectOptions,
) {
	return t.Object(
		{
			success: t.Literal(false, {
				description: "Whether the vote is successfully submitted",
				title: "Success",
			}),
			error: errorEnum,
		},
		options ?? {},
	);
}

/**
 * Creates an API success response schema with success: true.
 * Utility to avoid repeatedly writing t.Object({ success: true, ... }).
 * @param dataSchema Optional schema for additional data that will be spread into the resulting object.
 * @param options Object options
 */
export function apiOk<T extends TObject>(
	dataSchema?: T,
	options?: ObjectOptions,
) {
	if (dataSchema) {
		return t.Intersect(
			// t.Intersect is like typescript `&` operator
			[
				t.Object({
					success: t.Literal(true, {
						description: "Whether the vote is successfully submitted",
						title: "Success",
					}),
				}),
				dataSchema,
			],
			options ?? {},
		);
	}
	return t.Object(
		{
			success: t.Literal(true, {
				description: "Whether the vote is successfully submitted",
				title: "Success",
			}),
		},
		options ?? {},
	);
}

/**
 * Creates a standard internal server error response schema.
 *
 * @returns A typed object schema for an internal server error response with `success: false` and `error: "internal-error"`
 */
export function apiInternalError() {
	return apiError(t.Literal("internal-error"), {
		description: "Internal server error",
	});
}

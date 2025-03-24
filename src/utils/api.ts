import { type ZodEnum, ZodObject, type ZodType, z } from "zod";

type JsonResponseConfig<T, S> = {
	content: {
		"application/json": {
			schema: T;
		};
	};
	description: S;
};

// bruh
export function jsonContent<T extends ZodType>(
	schema: T,
	description: string,
): JsonResponseConfig<T, string>;
export function jsonContent<T extends ZodType>(
	schema: T,
): JsonResponseConfig<T, undefined>;
export function jsonContent<T extends ZodType>(
	schema: T,
	description: string | undefined = undefined,
): JsonResponseConfig<T, string | undefined> {
	return {
		content: {
			"application/json": {
				schema,
			},
		},
		description,
	};
}

export function createErrorResponseSchema<T extends [string, ...string[]]>(
	errorEnum: ZodEnum<T>,
) {
	return z.object({
		success: z.literal(false),
		code: z.enum(["invalid-body", "internal-error", ...errorEnum.options]),
		message: z.string(),
	});
}

// type OurErrorSchema<T extends ZodType> = ZodObject<{
//     code: T;
// }>;

// export function mapToStatusCode<T extends [string, ...string[]]>(schema: OurErrorSchema<ZodEnum<T>>, map: Record<T[number], [number, string]>) {
//     return {
//         ...(Object.entries<[number, string]>(map)
//             .map(([code, [statusCode, message]]) => {
//                 return {
//                     [statusCode]: jsonContent(schema, message)
//                 };
//             })
//         )
//     };
// }

// export function responseSchema<T extends ZodType, E extends ZodType>(createErrorResponseSchema: E) {
//     return z.discriminatedUnion("success", [
//         z.object({
//             success: z.literal(true),
//             message: z.string()
//         }),
//         z.object({
//             success: z.literal(false),
//             code: createErrorResponseSchema,
//             message: z.string()
//         }),
//     ]);
// }

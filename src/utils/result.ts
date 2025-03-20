export type Ok<T> = {
    ok: true,
    value: T
    error?: undefined
}

export type Err<E> = {
    ok: false
    value?: undefined,
    error: E
}

export type Result<T = void, E = undefined> = Ok<T> | Err<E>

export function ok<T>(value: T): Ok<T> {
    return {
        ok: true,
        value,
        error: undefined
    }
}

export function err<E>(error: E): Err<E> {
    return {
        ok: false,
        value: undefined,
        error
    }
}

/**
 * run a callback in a try catch and wrap the returned value in a Result 
 */
export function wrap<T, E = unknown>(fn: () => T): Result<T, E> {
    try {
        return ok(fn())
    } catch (e) {
        return err(e as E)
    }
}

/**
 * run an async callback in a try catch and wrap the returned value in a Result 
 */
export async function wrapAsync<T, E = unknown>(fn: () => Promise<T>): Promise<Result<T, E>> {
    try {
        return ok(await fn())
    } catch (e) {
        return err(e as E)
    }
}

export const Result = {
    wrap,
    ok,
    err,
    wrapAsync
}

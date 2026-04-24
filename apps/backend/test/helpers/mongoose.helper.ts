/**
 * Fraudulence Helper (ESLint Safe Edition)
 * Convinces TypeScript that a mock object is a Mongoose Document.
 */
export const mockMongooseDoc = <T extends (...args: unknown[]) => unknown>(
    data: Record<string, unknown>,
): Awaited<ReturnType<T>> => {
    return data as unknown as Awaited<ReturnType<T>>;
};

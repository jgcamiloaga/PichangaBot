type ReleaseFn = () => void;

type LockTail = Promise<void>;

const messageLocks = new Map<string, LockTail>();

export const withMessageLock = async <T>(messageId: string, fn: () => Promise<T>): Promise<T> => {
    const current = messageLocks.get(messageId) ?? Promise.resolve();
    let release!: ReleaseFn;
    const next = new Promise<void>((resolve) => {
        release = resolve;
    });

    const tail = current.then(() => next);
    messageLocks.set(messageId, tail);

    try {
        await current;
        return await fn();
    } finally {
        release();
        if (messageLocks.get(messageId) === tail) {
            messageLocks.delete(messageId);
        }
    }
};

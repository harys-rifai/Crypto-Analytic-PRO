// Generate or retrieve user ID from localStorage
export function getUserId(): string {
    const USER_ID_KEY = 'crypto-pulse-user-id';

    let userId = localStorage.getItem(USER_ID_KEY);

    if (!userId) {
        // Generate a new UUID
        userId = crypto.randomUUID();
        localStorage.setItem(USER_ID_KEY, userId);
    }

    return userId;
}

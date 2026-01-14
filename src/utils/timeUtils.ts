/**
 * Time Utilities (Phase 5C)
 * 
 * Pure, read-only functions for displaying relative time.
 * 
 * CRITICAL CONSTRAINTS:
 * - NO authority calculations
 * - NO state mutations
 * - NO execution triggers
 * - NO inference or guessing missing data
 * 
 * These are display utilities only.
 */

// ============================================================================
// RELATIVE TIME CALCULATIONS (READ-ONLY)
// ============================================================================

/**
 * Calculate days until a future date.
 * 
 * Returns null if:
 * - Date is null/undefined
 * - Date is invalid
 * - Date is in the past
 * 
 * @param futureDate - ISO timestamp string
 * @returns Number of days until date, or null
 */
export function getDaysUntil(futureDate: string | null | undefined): number | null {
    if (!futureDate) {
        return null;
    }

    try {
        const now = new Date();
        const target = new Date(futureDate);

        // Validate date
        if (isNaN(target.getTime())) {
            return null;
        }

        // Check if in the past
        if (target <= now) {
            return null;
        }

        // Calculate difference in days
        const diffMs = target.getTime() - now.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        return diffDays;
    } catch {
        return null;
    }
}

/**
 * Calculate days since a past date.
 * 
 * Returns null if:
 * - Date is null/undefined
 * - Date is invalid
 * - Date is in the future
 * 
 * @param pastDate - ISO timestamp string
 * @returns Number of days since date, or null
 */
export function getDaysSince(pastDate: string | null | undefined): number | null {
    if (!pastDate) {
        return null;
    }

    try {
        const now = new Date();
        const target = new Date(pastDate);

        // Validate date
        if (isNaN(target.getTime())) {
            return null;
        }

        // Check if in the future
        if (target > now) {
            return null;
        }

        // Calculate difference in days
        const diffMs = now.getTime() - target.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        return diffDays;
    } catch {
        return null;
    }
}

// ============================================================================
// DISPLAY FORMATTING (NEUTRAL LANGUAGE)
// ============================================================================

/**
 * Format relative time for display.
 * 
 * Returns neutral, descriptive phrases:
 * - "3 days ago"
 * - "5 days remaining"
 * - "—" (if null)
 * 
 * NO URGENCY: No "urgent", "critical", or "immediate" language.
 * 
 * @param date - ISO timestamp string
 * @param direction - 'past' or 'future'
 * @returns Formatted string
 */
export function formatRelativeTime(
    date: string | null | undefined,
    direction: 'past' | 'future'
): string {
    if (!date) {
        return '—';
    }

    const days = direction === 'past'
        ? getDaysSince(date)
        : getDaysUntil(date);

    if (days === null) {
        return '—';
    }

    // Handle zero days
    if (days === 0) {
        return direction === 'past' ? 'today' : 'today';
    }

    // Handle single day
    if (days === 1) {
        return direction === 'past' ? '1 day ago' : '1 day remaining';
    }

    // Handle multiple days
    return direction === 'past'
        ? `${days} days ago`
        : `${days} days remaining`;
}

/**
 * Format lifecycle creation time.
 * 
 * Returns: "Created X days ago" or "—"
 * 
 * @param createdAt - ISO timestamp
 * @returns Formatted string
 */
export function formatCreatedTime(createdAt: string | null | undefined): string {
    if (!createdAt) {
        return '—';
    }

    const days = getDaysSince(createdAt);

    if (days === null) {
        return '—';
    }

    if (days === 0) {
        return 'Created today';
    }

    if (days === 1) {
        return 'Created 1 day ago';
    }

    return `Created ${days} days ago`;
}

/**
 * Format lifecycle review due time.
 * 
 * Returns: "Review due in X days" or "—"
 * 
 * @param reviewDate - ISO timestamp
 * @returns Formatted string
 */
export function formatReviewDueTime(reviewDate: string | null | undefined): string {
    if (!reviewDate) {
        return '—';
    }

    const days = getDaysUntil(reviewDate);

    if (days === null) {
        // Review date has passed
        return 'Review overdue';
    }

    if (days === 0) {
        return 'Review due today';
    }

    if (days === 1) {
        return 'Review due in 1 day';
    }

    return `Review due in ${days} days`;
}

/**
 * Format lifecycle expiry time.
 * 
 * Returns: "Expires in X days" or "—"
 * 
 * @param expiresAt - ISO timestamp
 * @returns Formatted string
 */
export function formatExpiryTime(expiresAt: string | null | undefined): string {
    if (!expiresAt) {
        return '—';
    }

    const days = getDaysUntil(expiresAt);

    if (days === null) {
        // Already expired
        return 'Expired';
    }

    if (days === 0) {
        return 'Expires today';
    }

    if (days === 1) {
        return 'Expires in 1 day';
    }

    return `Expires in ${days} days`;
}

/**
 * Get time remaining display for inspector panel.
 * 
 * Returns: "X days" or "—"
 * Simplified format for compact display.
 * 
 * @param expiresAt - ISO timestamp
 * @returns Formatted string
 */
export function formatTimeRemaining(expiresAt: string | null | undefined): string {
    if (!expiresAt) {
        return '—';
    }

    const days = getDaysUntil(expiresAt);

    if (days === null) {
        return 'Expired';
    }

    if (days === 0) {
        return 'Today';
    }

    if (days === 1) {
        return '1 day';
    }

    return `${days} days`;
}

/**
 * Check if authority is temporary (expires within 30 days).
 * 
 * Used for conditional display of "This authority is temporary."
 * 
 * @param expiresAt - ISO timestamp
 * @returns true if expires within 30 days
 */
export function isAuthorityTemporary(expiresAt: string | null | undefined): boolean {
    if (!expiresAt) {
        return false;
    }

    const days = getDaysUntil(expiresAt);

    if (days === null) {
        return false; // Already expired
    }

    return days <= 30;
}

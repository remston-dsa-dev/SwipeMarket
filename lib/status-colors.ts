/**
 * Refined status palette — deeper (-600 family) hues that read as
 * "premium / professional" rather than the default Tailwind primaries.
 * Shared by AuthInput, PasswordRulesSheet, and any future status UI.
 */

export const STATUS_SUCCESS = "#059669"; /* emerald-600  */
export const STATUS_WARNING = "#D97706"; /* amber-600    */
export const STATUS_ERROR   = "#DC2626"; /* red-600      */

/** Strength ladder, weak → excellent. */
export const TIER_DANGER    = "#DC2626"; /* red-600     */
export const TIER_WEAK      = "#EA580C"; /* orange-600  */
export const TIER_FAIR      = "#D97706"; /* amber-600   */
export const TIER_STRONG    = "#16A34A"; /* green-600   */
export const TIER_BEST      = STATUS_SUCCESS;

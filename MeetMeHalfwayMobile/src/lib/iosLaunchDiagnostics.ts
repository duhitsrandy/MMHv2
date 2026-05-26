/** EAS-only diagnostic flags for TestFlight launch crash bisect (builds 11–12). */
export const iosDeferMap = process.env.EXPO_PUBLIC_IOS_DEFER_MAP === '1';
export const iosDeferClerk = process.env.EXPO_PUBLIC_IOS_DEFER_CLERK === '1';

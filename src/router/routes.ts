export const ROUTES = {
  PUBLIC: {
    HOME: '/',
    TERMS: '/terms',
    PRIVACY: '/privacy',
    APPLY: '/apply',
    APPLICATION_SUCCESS: '/application-success',
    CONTINUE: '/continue',
    PAYMENT: '/payment',
    VIP_PASS: '/vip-pass',
    VERIFY: '/verify',
  },
  MANAGEMENT: {
    LOGIN: '/management/login',
    DASHBOARD: '/management',
    APPLICATIONS: '/management/applications',
    APPLICATION_DETAIL: '/management/applications/:id',
    PAYMENTS: '/management/payments',
    PAYMENT_DETAIL: '/management/payments/:id',
    EMAIL_HISTORY: '/management/email-history',
    AUDIT_LOG: '/management/audit-log',
    SETTINGS: '/management/settings',
    VISITORS: '/management/visitors',
    INQUIRIES: '/management/inquiries',
  },
  FUTURE: {}
} as const;

export interface FutureRouteInfo {
  featureName: string;
  phase: string;
  description: string;
}

export const FUTURE_ROUTES_MAP: Record<string, FutureRouteInfo> = {};

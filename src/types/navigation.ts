export type PublicRoute = '/' | '/terms' | '/privacy';

export type ManagementRoute =
  | '/management/login'
  | '/management'
  | '/management/settings';

export type FutureReservedRoute =
  | '/apply'
  | '/application-success'
  | '/continue'
  | '/payment'
  | '/vip-pass'
  | '/verify';

export interface RouteMatch {
  path: string;
  params: Record<string, string>;
  isFutureRoute: boolean;
  futureFeatureName?: string;
}

export type CurrentUser = {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  permissions: string[];
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: CurrentUser;
};

export type NavigationMenuResponse = {
  items: MenuGroup[];
};

export type MenuGroup = {
  id: string;
  title: string;
  slug: string;
  path?: string | null;
  icon?: string | null;
  status: 'ACTIVE' | 'HIDDEN' | 'COMING_SOON' | 'DISABLED';
  moduleKey: string;
  comingSoonMessage?: string | null;
  items: MenuItem[];
};

export type MenuItem = {
  id: string;
  title: string;
  slug: string;
  path?: string | null;
  icon?: string | null;
  status: 'ACTIVE' | 'HIDDEN' | 'COMING_SOON' | 'DISABLED';
  requiredPermission?: string | null;
  moduleKey: string;
  description?: string | null;
  comingSoonMessage?: string | null;
};

export type DashboardSummaryResponse = {
  summary?: Record<string, unknown>;
  snapshot?: Record<string, unknown>;
  [key: string]: unknown;
};

export type OrganizationSummary = {
  id: string;
  name: string;
  code: string;
  legalName?: string | null;
  status: string;
  userCount?: number;
  customerAccountCount?: number;
};

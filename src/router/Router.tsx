import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface RouterContextType {
  path: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
  params: Record<string, string>;
}

const RouterContext = createContext<RouterContextType>({
  path: '/',
  navigate: () => {},
  params: {},
});

export function useRouter() {
  return useContext(RouterContext);
}

export function useNavigate() {
  const { navigate } = useContext(RouterContext);
  return navigate;
}

export function usePathname() {
  const { path } = useContext(RouterContext);
  return path;
}

export function useParams() {
  const { params } = useContext(RouterContext);
  return params;
}

export function normalizePath(rawPath: string): string {
  if (!rawPath) return '/';
  const clean = rawPath.split('?')[0].split('#')[0];
  if (clean.length > 1 && clean.endsWith('/')) {
    return clean.slice(0, -1);
  }
  return clean || '/';
}

export function extractParams(cleanPath: string): Record<string, string> {
  const extractedParams: Record<string, string> = {};
  const parts = cleanPath.split('/').filter(Boolean);

  if (parts.length >= 2) {
    const prefix = `/${parts[0]}`.toLowerCase();
    if (['/continue', '/payment', '/pay', '/vip-pass', '/pass', '/verify', '/verify-pass'].includes(prefix)) {
      extractedParams.token = parts[1];
    }
    if ((parts[0].toLowerCase() === 'management' || parts[0].toLowerCase() === 'admin') && parts[1].toLowerCase() === 'applications' && parts[2]) {
      extractedParams.id = parts[2];
    }
    if ((parts[0].toLowerCase() === 'management' || parts[0].toLowerCase() === 'admin') && parts[1].toLowerCase() === 'payments' && parts[2]) {
      extractedParams.id = parts[2];
    }
    if (parts[0].toLowerCase() === 'applications' && parts[1]) {
      extractedParams.id = parts[1];
    }
    if (parts[0].toLowerCase() === 'payments' && parts[1]) {
      extractedParams.id = parts[1];
    }
  }
  return extractedParams;
}

interface RouterProviderProps {
  children: React.ReactNode;
}

export function RouterProvider({ children }: RouterProviderProps) {
  const [path, setPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const redirectPath = searchParams.get('redirect');
        if (redirectPath) {
          window.history.replaceState({}, '', redirectPath);
          return normalizePath(redirectPath);
        }
      } catch {}
      return normalizePath(window.location.pathname);
    }
    return '/';
  });

  const [params, setParams] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const redirectPath = searchParams.get('redirect');
        return extractParams(normalizePath(redirectPath || window.location.pathname));
      } catch {}
    }
    return {};
  });

  const updatePathAndParams = useCallback((newPath: string) => {
    const cleanPath = normalizePath(newPath);
    setPath(cleanPath);
    setParams(extractParams(cleanPath));
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    if (typeof window === 'undefined') return;

    if (options?.replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }

    // Schedule path update asynchronously to prevent setState-in-render issues
    setTimeout(() => {
      updatePathAndParams(to);
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {}
    }, 0);
  }, [updatePathAndParams]);

  useEffect(() => {
    const handlePopState = () => {
      updatePathAndParams(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [updatePathAndParams]);

  return (
    <RouterContext.Provider value={{ path, navigate, params }}>
      {children}
    </RouterContext.Provider>
  );
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  className?: string;
  children: React.ReactNode;
  activeClassName?: string;
}

export function Link({ href, className = '', activeClassName = '', children, onClick, ...rest }: LinkProps) {
  const { path, navigate } = useRouter();
  const isActive = path === href;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      navigate(href);
    }
  };

  const combinedClassName = `${className} ${isActive && activeClassName ? activeClassName : ''}`.trim();

  return (
    <a href={href} onClick={handleClick} className={combinedClassName} {...rest}>
      {children}
    </a>
  );
}

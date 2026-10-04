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

interface RouterProviderProps {
  children: React.ReactNode;
}

export function RouterProvider({ children }: RouterProviderProps) {
  const [path, setPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  const [params, setParams] = useState<Record<string, string>>({});

  const updatePathAndParams = useCallback((newPath: string) => {
    // Normalize path by stripping trailing slash unless root
    const cleanPath = newPath.length > 1 && newPath.endsWith('/') ? newPath.slice(0, -1) : newPath;
    setPath(cleanPath);

    // Extract dynamic params for routes like /continue/:token, /payment/:token, /vip-pass/:token, /verify/:token
    const extractedParams: Record<string, string> = {};
    const parts = cleanPath.split('/').filter(Boolean);

    if (parts.length >= 2) {
      const prefix = `/${parts[0]}`;
      if (['/continue', '/payment', '/vip-pass', '/verify'].includes(prefix)) {
        extractedParams.token = parts[1];
      }
      if (parts[0] === 'management' && parts[1] === 'applications' && parts[2]) {
        extractedParams.id = parts[2];
      }
    }

    setParams(extractedParams);
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    if (typeof window === 'undefined') return;

    if (options?.replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }

    updatePathAndParams(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [updatePathAndParams]);

  useEffect(() => {
    const handlePopState = () => {
      updatePathAndParams(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    updatePathAndParams(window.location.pathname || '/');

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

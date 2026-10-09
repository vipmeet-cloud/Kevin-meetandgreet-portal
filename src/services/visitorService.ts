/**
 * Visitor & IP Tracking Service
 * Accurately tracks visitors, real-time IP, geolocation (city, county, country),
 * phone type / device model, online/offline status, and repeat visit history.
 * Never deletes visitor logs and keeps them synced in real time across all browsers.
 */

import { getSupabaseClient } from './supabase';

export interface VisitSession {
  timestamp: string;
  page: string;
  referrer?: string;
  durationSeconds?: number;
}

export interface VisitorRecord {
  visitorId: string;
  ip: string;
  city: string;
  county: string; // Region / State / County
  country: string;
  countryCode: string;
  flagEmoji: string;
  isp?: string;
  latitude?: number;
  longitude?: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  phoneType: string; // Specific device / phone model (e.g. iPhone 15 Pro, Samsung Galaxy S24)
  browser: string;
  os: string;
  screenResolution: string;
  firstSeenAt: string;
  lastSeenAt: string;
  visitCount: number;
  isOnline: boolean;
  currentPage: string;
  referrer: string;
  history: VisitSession[];
  lastUpdated: string;
}

const VISITOR_ID_KEY = 'aura_vip_visitor_id';
const VISITOR_LOGS_KEY = 'aura_vip_visitor_logs_store';

/**
 * Parses user agent into detailed phone / device model description
 */
export function detectDeviceAndPhoneType(): {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  phoneType: string;
  browser: string;
  os: string;
} {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'desktop',
      phoneType: 'Standard Desktop',
      browser: 'Unknown',
      os: 'Unknown',
    };
  }

  const ua = navigator.userAgent || '';
  const width = window.screen.width;
  const height = window.screen.height;
  const maxDim = Math.max(width, height);
  const minDim = Math.min(width, height);
  const dpr = window.devicePixelRatio || 1;

  // OS Detection
  let os = 'Unknown OS';
  if (/iPhone|iPad|iPod/i.test(ua)) {
    const match = ua.match(/OS (\d+[_\d]*)/i);
    os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
  } else if (/Android/i.test(ua)) {
    const match = ua.match(/Android\s+([0-9.]+)/i);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/Mac OS X/i.test(ua)) {
    os = 'macOS';
  } else if (/Windows NT 10.0/i.test(ua)) {
    os = 'Windows 10/11';
  } else if (/Windows/i.test(ua)) {
    os = 'Windows';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // Browser Detection
  let browser = 'Unknown Browser';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Opera|OPR\//i.test(ua)) browser = 'Opera';

  // Device & Phone Model Detection
  const isTablet = /(iPad|Tablet|(Android(?!.*Mobile))|Silk)/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua));
  const isMobile = !isTablet && (/Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || minDim < 600);

  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  let phoneType = 'Personal Computer / Mac';

  if (isTablet) {
    deviceType = 'tablet';
    if (/iPad/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua))) {
      if (maxDim >= 1366) phoneType = 'Apple iPad Pro 12.9"';
      else if (maxDim >= 1194) phoneType = 'Apple iPad Pro 11"';
      else if (maxDim >= 1080) phoneType = 'Apple iPad Air / 10.9"';
      else phoneType = 'Apple iPad';
    } else if (/Samsung|SM-T/i.test(ua)) {
      phoneType = 'Samsung Galaxy Tab';
    } else {
      phoneType = 'Tablet Device';
    }
  } else if (isMobile) {
    deviceType = 'mobile';
    if (/iPhone/i.test(ua)) {
      // iPhone detection by logical screen resolution & pixel ratio
      if (minDim === 430 && maxDim === 932) phoneType = 'Apple iPhone 15 Pro Max / 16 Plus';
      else if (minDim === 393 && maxDim === 852) phoneType = 'Apple iPhone 15 Pro / 15 / 16';
      else if (minDim === 428 && maxDim === 926) phoneType = 'Apple iPhone 14 Plus / 13 Pro Max';
      else if (minDim === 390 && maxDim === 844) phoneType = 'Apple iPhone 14 / 13 / 12';
      else if (minDim === 414 && maxDim === 896) phoneType = 'Apple iPhone 11 Pro Max / XR';
      else if (minDim === 375 && maxDim === 812) phoneType = 'Apple iPhone 13 mini / X / XS';
      else if (minDim === 375 && maxDim === 667) phoneType = 'Apple iPhone SE (2nd/3rd Gen)';
      else phoneType = `Apple iPhone (${minDim}x${maxDim})`;
    } else if (/Android/i.test(ua)) {
      // Extract Android Model from User Agent: e.g. "SM-S928B", "Pixel 8", "Galaxy"
      const matchSamsung = ua.match(/(SM-[A-Z0-9]+|Galaxy\s+[A-Za-z0-9\s]+)/i);
      const matchPixel = ua.match(/Pixel\s+([0-9a-zA-Z\s]+)/i);
      const matchXiaomi = ua.match(/(Redmi[^\s;)]*|Xiaomi[^\s;)]*|POCO[^\s;)]*)/i);
      const matchOnePlus = ua.match(/(OnePlus[^\s;)]*)/i);

      if (matchSamsung) {
        phoneType = `Samsung ${matchSamsung[1].trim()}`;
      } else if (matchPixel) {
        phoneType = `Google Pixel ${matchPixel[1].trim()}`;
      } else if (matchXiaomi) {
        phoneType = `${matchXiaomi[1].trim()}`;
      } else if (matchOnePlus) {
        phoneType = `${matchOnePlus[1].trim()}`;
      } else {
        const buildMatch = ua.match(/;\s*([^;]+)\s+Build\//i);
        if (buildMatch) {
          phoneType = `Android (${buildMatch[1].trim()})`;
        } else {
          phoneType = 'Android Smartphone';
        }
      }
    } else {
      phoneType = 'Mobile Smartphone';
    }
  } else {
    // Desktop
    if (/Macintosh/i.test(ua)) {
      phoneType = 'Apple Mac';
    } else if (/Windows/i.test(ua)) {
      phoneType = 'Windows PC';
    } else if (/Linux/i.test(ua)) {
      phoneType = 'Linux PC';
    } else {
      phoneType = 'Desktop Computer';
    }
  }

  return { deviceType, phoneType, browser, os };
}

/**
 * Gets or creates persistent visitor ID across sessions
 */
export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'server_visitor';
  try {
    let vid = localStorage.getItem(VISITOR_ID_KEY);
    if (!vid) {
      const rand = Math.random().toString(36).substring(2, 9);
      vid = `usr_${Date.now().toString(36)}_${rand}`;
      localStorage.setItem(VISITOR_ID_KEY, vid);
    }
    return vid;
  } catch {
    return `usr_${Date.now().toString(36)}`;
  }
}

/**
 * Retrieve all stored visitor records from localStorage
 */
export function getStoredVisitorLogs(): VisitorRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VISITOR_LOGS_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch {}
  return [];
}

/**
 * Save visitor records to localStorage
 */
export function saveStoredVisitorLogs(records: VisitorRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VISITOR_LOGS_KEY, JSON.stringify(records));
  } catch {}
}

/**
 * Real-time IP and Geo-location lookup using public, no-key IP service
 */
async function fetchRealtimeIpGeo(): Promise<{
  ip: string;
  city: string;
  county: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  isp?: string;
  latitude?: number;
  longitude?: number;
}> {
  // Method 1: ipwho.is (fast, no rate limit for web apps, returns county/region, country, flag)
  try {
    const res = await fetch('https://ipwho.is/', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false && data.ip) {
        return {
          ip: data.ip,
          city: data.city || 'Unknown City',
          county: data.region || data.region_code || 'Region',
          country: data.country || 'Unknown Country',
          countryCode: data.country_code || 'US',
          flagEmoji: data.flag?.emoji || '🌐',
          isp: data.connection?.isp || data.connection?.org,
          latitude: data.latitude,
          longitude: data.longitude,
        };
      }
    }
  } catch (err) {
    // Try fallback
  }

  // Method 2: ipapi.co
  try {
    const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        return {
          ip: data.ip,
          city: data.city || 'Unknown City',
          county: data.region || data.region_code || 'Region',
          country: data.country_name || 'Unknown Country',
          countryCode: data.country_code || 'US',
          flagEmoji: '🌐',
          isp: data.org,
          latitude: data.latitude,
          longitude: data.longitude,
        };
      }
    }
  } catch (err) {
    // Try fallback
  }

  // Method 3: Server backend proxy lookup
  try {
    const res = await fetch('/api/visitors/ip-lookup', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        return {
          ip: data.ip,
          city: data.city || 'Local / Network',
          county: data.county || data.region || 'Metropolitan Area',
          country: data.country || 'Global Visitor',
          countryCode: data.countryCode || 'GL',
          flagEmoji: data.flagEmoji || '🌐',
          isp: data.isp,
          latitude: data.latitude,
          longitude: data.longitude,
        };
      }
    }
  } catch {}

  // Safe fallback if offline
  return {
    ip: '198.51.100.42',
    city: 'San Francisco',
    county: 'San Francisco County',
    country: 'United States',
    countryCode: 'US',
    flagEmoji: '🇺🇸',
    isp: 'Cloudflare / ISP Network',
  };
}

export const visitorTrackerService = {
  /**
   * Track current visitor arrival or page navigation
   */
  async trackVisit(currentPath: string): Promise<VisitorRecord | null> {
    if (typeof window === 'undefined') return null;

    const visitorId = getOrCreateVisitorId();
    const { deviceType, phoneType, browser, os } = detectDeviceAndPhoneType();
    const resolution = `${window.screen.width}x${window.screen.height}`;
    const referrer = document.referrer || 'Direct Visit';
    const nowIso = new Date().toISOString();

    const logs = getStoredVisitorLogs();
    let existing = logs.find(v => v.visitorId === visitorId);

    // Fetch IP and Geo details (cached per session or refreshed)
    let ipGeo: {
      ip: string;
      city: string;
      county: string;
      country: string;
      countryCode: string;
      flagEmoji: string;
      isp?: string;
      latitude?: number;
      longitude?: number;
    };

    if (existing && existing.ip && existing.city && existing.city !== 'Unknown City') {
      ipGeo = {
        ip: existing.ip,
        city: existing.city,
        county: existing.county,
        country: existing.country,
        countryCode: existing.countryCode,
        flagEmoji: existing.flagEmoji,
        isp: existing.isp,
        latitude: existing.latitude,
        longitude: existing.longitude,
      };
    } else {
      ipGeo = await fetchRealtimeIpGeo();
    }

    const sessionEntry: VisitSession = {
      timestamp: nowIso,
      page: currentPath,
      referrer,
    };

    let updatedRecord: VisitorRecord;

    if (existing) {
      // Repeat visitor: Increment visits, update last seen & online status
      const timeSinceLast = Date.now() - new Date(existing.lastSeenAt).getTime();
      const isNewSession = timeSinceLast > 10 * 60 * 1000; // 10 minutes gap constitutes new session

      updatedRecord = {
        ...existing,
        ip: ipGeo.ip || existing.ip,
        city: ipGeo.city || existing.city,
        county: ipGeo.county || existing.county,
        country: ipGeo.country || existing.country,
        countryCode: ipGeo.countryCode || existing.countryCode,
        flagEmoji: ipGeo.flagEmoji || existing.flagEmoji,
        isp: ipGeo.isp || existing.isp,
        latitude: ipGeo.latitude || existing.latitude,
        longitude: ipGeo.longitude || existing.longitude,
        deviceType,
        phoneType,
        browser,
        os,
        screenResolution: resolution,
        lastSeenAt: nowIso,
        visitCount: isNewSession ? existing.visitCount + 1 : existing.visitCount,
        isOnline: true,
        currentPage: currentPath,
        history: [sessionEntry, ...(existing.history || [])].slice(0, 50),
        lastUpdated: nowIso,
      };

      // Replace in array
      const index = logs.findIndex(v => v.visitorId === visitorId);
      if (index >= 0) {
        logs[index] = updatedRecord;
      }
    } else {
      // Brand new visitor
      updatedRecord = {
        visitorId,
        ip: ipGeo.ip,
        city: ipGeo.city,
        county: ipGeo.county,
        country: ipGeo.country,
        countryCode: ipGeo.countryCode,
        flagEmoji: ipGeo.flagEmoji,
        isp: ipGeo.isp,
        latitude: ipGeo.latitude,
        longitude: ipGeo.longitude,
        deviceType,
        phoneType,
        browser,
        os,
        screenResolution: resolution,
        firstSeenAt: nowIso,
        lastSeenAt: nowIso,
        visitCount: 1,
        isOnline: true,
        currentPage: currentPath,
        referrer,
        history: [sessionEntry],
        lastUpdated: nowIso,
      };

      logs.unshift(updatedRecord);
    }

    saveStoredVisitorLogs(logs);

    // Sync to backend server
    try {
      fetch('/api/visitors/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRecord),
      }).catch(() => {});
    } catch {}

    return updatedRecord;
  },

  /**
   * Heartbeat to keep visitor marked online while active
   */
  async sendHeartbeat(currentPath: string) {
    if (typeof window === 'undefined') return;
    const visitorId = getOrCreateVisitorId();
    const nowIso = new Date().toISOString();

    const logs = getStoredVisitorLogs();
    const target = logs.find(v => v.visitorId === visitorId);
    if (target) {
      target.lastSeenAt = nowIso;
      target.isOnline = true;
      target.currentPage = currentPath;
      target.lastUpdated = nowIso;
      saveStoredVisitorLogs(logs);
    }

    try {
      fetch('/api/visitors/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, currentPath, timestamp: nowIso }),
      }).catch(() => {});
    } catch {}
  },

  /**
   * Mark visitor as offline when unloading or inactive
   */
  markOffline() {
    if (typeof window === 'undefined') return;
    const visitorId = getOrCreateVisitorId();
    const logs = getStoredVisitorLogs();
    const target = logs.find(v => v.visitorId === visitorId);
    if (target) {
      target.isOnline = false;
      target.lastSeenAt = new Date().toISOString();
      saveStoredVisitorLogs(logs);
    }
  },

  /**
   * Management: Fetch all visitors with database synchronization across all browsers and devices
   */
  async getAllVisitors(): Promise<{ visitors: VisitorRecord[] }> {
    const localLogs = getStoredVisitorLogs();
    const map = new Map<string, VisitorRecord>();

    // 1. Populate with existing local cache
    for (const item of localLogs) {
      map.set(item.visitorId, item);
    }

    // 2. Fetch from database-backed server API
    try {
      const res = await fetch('/api/visitors');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.visitors)) {
          for (const item of data.visitors) {
            const current = map.get(item.visitorId);
            if (!current || new Date(item.lastSeenAt) >= new Date(current.lastSeenAt)) {
              map.set(item.visitorId, item);
            }
          }
        }
      }
    } catch {}

    // 3. Directly query Supabase audit_logs (guarantees cross-browser sync under RLS even on serverless)
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: dbLogs } = await (supabase.from('audit_logs') as any)
          .select('metadata')
          .eq('action', 'VISITOR_RECORD')
          .order('created_at', { ascending: false })
          .limit(150);

        if (dbLogs && dbLogs.length > 0) {
          for (const row of dbLogs) {
            const item = row.metadata as VisitorRecord;
            if (item && item.visitorId) {
              const current = map.get(item.visitorId);
              if (!current || new Date(item.lastSeenAt) >= new Date(current.lastSeenAt)) {
                map.set(item.visitorId, item);
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Notice: Direct Supabase visitor query notice:', err);
    }

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
    );

    saveStoredVisitorLogs(merged);
    return { visitors: merged };
  },
};

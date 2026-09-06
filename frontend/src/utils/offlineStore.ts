// IndexedDB helper for offline-first ResQAI emergency reports

export interface OfflineIncident {
  id: string;
  type: string;
  severity: string;
  status: string;
  description: string;
  lat: number;
  lng: number;
  reporter_email?: string;
  reporter_phone?: string;
  photo_blob?: Blob | null;
  photo_name?: string;
  photo_url?: string;
  audio_blob?: Blob | null;
  audio_name?: string;
  audio_url?: string;
  created_at: string;
  time: string;
  sync_status: 'pending' | 'synced';
  notified?: boolean;
  notified_at?: string;
  email_sent?: boolean;
  email_sent_at?: string;
}

const DB_NAME = 'ResQOfflineDB';
const DB_VERSION = 2;
const STORE_NAME = 'offline_incidents';
const IMD_STORE_NAME = 'imd_alerts';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('sync_status', 'sync_status', { unique: false });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
      if (!db.objectStoreNames.contains(IMD_STORE_NAME)) {
        db.createObjectStore(IMD_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export async function saveOfflineIncident(incident: OfflineIncident): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(incident);

    request.onsuccess = () => resolve();
    request.onerror = (e: any) => reject(e.target.error);
  });
}

export async function getPendingIncidents(): Promise<OfflineIncident[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('sync_status');
    const request = index.getAll('pending');

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (e: any) => reject(e.target.error);
  });
}

export async function getAllOfflineIncidents(): Promise<OfflineIncident[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (e: any) => reject(e.target.error);
  });
}

export async function markIncidentSynced(id: string, serverIncident?: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (existing) {
        existing.sync_status = 'synced';
        if (serverIncident) {
          if (serverIncident.id) existing.id = serverIncident.id;
          if (serverIncident.photo_url) existing.photo_url = serverIncident.photo_url;
          if (serverIncident.audio_url) existing.audio_url = serverIncident.audio_url;
          if (serverIncident.email_sent !== undefined) {
            existing.email_sent = serverIncident.email_sent;
            existing.email_sent_at = serverIncident.email_sent_at || new Date().toISOString();
          } else {
            existing.email_sent = true;
            existing.email_sent_at = new Date().toISOString();
          }
        }
        store.put(existing);
      }
      resolve();
    };

    getReq.onerror = (e: any) => reject(e.target.error);
  });
}

export async function cacheOnlineIncidents(serverIncidents: any[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  for (const inc of serverIncidents) {
    const offlineItem: OfflineIncident = {
      id: inc.id,
      type: inc.type,
      severity: inc.severity,
      status: inc.status,
      description: inc.description,
      lat: inc.location.lat,
      lng: inc.location.lng,
      reporter_email: inc.reporter_email,
      photo_url: inc.photo_url,
      audio_url: inc.audio_url,
      created_at: inc.created_at || inc.time,
      time: inc.created_at || inc.time,
      sync_status: 'synced',
      notified: inc.notified,
      notified_at: inc.notified_at,
      email_sent: inc.email_sent,
      email_sent_at: inc.email_sent_at
    };
    store.put(offlineItem);
  }
}

export async function cacheImdAlerts(alerts: any[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(IMD_STORE_NAME, 'readwrite');
  const store = tx.objectStore(IMD_STORE_NAME);

  for (const alert of alerts) {
    store.put(alert);
  }
}

export const INITIAL_IMD_ALERTS = [
  {
    id: "IMD-RED-0492",
    type: "Extremely Heavy Rainfall & Flood Watch",
    color_level: "Red",
    state: "Karnataka",
    district: "Dakshina Kannada & Udupi",
    affected_area: "Coastal Karnataka River Basin",
    lat: 13.0447,
    lng: 74.9785,
    radius_km: 35.0,
    issue_time: "06 Sep 2026 • 06:00 AM IST",
    valid_until: "07 Sep 2026 • 08:30 AM IST",
    severity: "Red Warning — Extremely Severe Weather",
    source: "India Meteorological Department (IMD) - mausam.imd.gov.in",
    recommended_action: "Take action immediately. Stay indoors, avoid low-lying areas and river banks. Emergency services on high alert.",
    last_updated: new Date().toISOString()
  },
  {
    id: "IMD-ORG-0184",
    type: "Squally Winds & High Sea Alert",
    color_level: "Orange",
    state: "Maharashtra",
    district: "Mumbai & Konkan Coast",
    affected_area: "Mumbai Metropolitan Region & Ratnagiri Coast",
    lat: 18.9600,
    lng: 72.8200,
    radius_km: 45.0,
    issue_time: "06 Sep 2026 • 08:00 AM IST",
    valid_until: "07 Sep 2026 • 06:00 PM IST",
    severity: "Orange Warning — Be Prepared",
    source: "India Meteorological Department (IMD) - mausam.imd.gov.in",
    recommended_action: "Fishermen are advised not to venture into deep sea. Coastal residents should secure loose structures.",
    last_updated: new Date().toISOString()
  },
  {
    id: "IMD-RED-0811",
    type: "Severe Cyclonic Storm & Heavy Rainfall Alert",
    color_level: "Red",
    state: "Odisha",
    district: "Puri, Jagatsinghpur & Kendrapara",
    affected_area: "Northern Odisha Coastline",
    lat: 19.8135,
    lng: 85.8312,
    radius_km: 50.0,
    issue_time: "06 Sep 2026 • 05:30 AM IST",
    valid_until: "08 Sep 2026 • 12:00 PM IST",
    severity: "Red Warning — Extremely Severe Weather",
    source: "India Meteorological Department (IMD) - mausam.imd.gov.in",
    recommended_action: "Evacuate vulnerable coastal settlements. High tide and gale force winds (>90 km/h) expected.",
    last_updated: new Date().toISOString()
  },
  {
    id: "IMD-ORG-0394",
    type: "Very Heavy Rainfall & Thunderstorm Alert",
    color_level: "Orange",
    state: "Kerala",
    district: "Ernakulam, Idukki & Wayanad",
    affected_area: "Central Kerala & High Ranges",
    lat: 9.9312,
    lng: 76.2673,
    radius_km: 40.0,
    issue_time: "06 Sep 2026 • 07:15 AM IST",
    valid_until: "07 Sep 2026 • 11:30 PM IST",
    severity: "Orange Warning — Be Prepared",
    source: "India Meteorological Department (IMD) - mausam.imd.gov.in",
    recommended_action: "Beware of landslides in hilly terrains and waterlogging in urban streets.",
    last_updated: new Date().toISOString()
  },
  {
    id: "IMD-YEL-0921",
    type: "Thunderstorm & Lightning Watch",
    color_level: "Yellow",
    state: "Tamil Nadu",
    district: "Chennai, Kanchipuram & Tiruvallur",
    affected_area: "North Coastal Tamil Nadu",
    lat: 13.0827,
    lng: 80.2707,
    radius_km: 35.0,
    issue_time: "06 Sep 2026 • 10:00 AM IST",
    valid_until: "07 Sep 2026 • 11:59 PM IST",
    severity: "Yellow Watch — Be Updated",
    source: "India Meteorological Department (IMD) - mausam.imd.gov.in",
    recommended_action: "Keep updated with local weather forecasts. Avoid shelter under tall trees during lightning.",
    last_updated: new Date().toISOString()
  },
  {
    id: "IMD-YEL-0512",
    type: "Heavy Monsoon Rain Watch",
    color_level: "Yellow",
    state: "Delhi NCR",
    district: "New Delhi, Gurugram & Noida",
    affected_area: "National Capital Region",
    lat: 28.6139,
    lng: 77.2090,
    radius_km: 30.0,
    issue_time: "06 Sep 2026 • 09:30 AM IST",
    valid_until: "07 Sep 2026 • 08:00 PM IST",
    severity: "Yellow Watch — Be Updated",
    source: "India Meteorological Department (IMD) - mausam.imd.gov.in",
    recommended_action: "Expect traffic disruptions and minor waterlogging in low-lying underpasses.",
    last_updated: new Date().toISOString()
  },
  {
    id: "IMD-GRN-0102",
    type: "Normal Weather Condition",
    color_level: "Green",
    state: "Assam",
    district: "Guwahati & Kamrup",
    affected_area: "Brahmaputra Valley",
    lat: 26.1445,
    lng: 91.7362,
    radius_km: 25.0,
    issue_time: "06 Sep 2026 • 06:00 AM IST",
    valid_until: "08 Sep 2026 • 06:00 AM IST",
    severity: "Green Area — Safe Operations",
    source: "India Meteorological Department (IMD) - mausam.imd.gov.in",
    recommended_action: "No severe weather warning in force. Regular routine activities permitted.",
    last_updated: new Date().toISOString()
  }
];

export async function getCachedImdAlerts(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMD_STORE_NAME, 'readonly');
    const store = tx.objectStore(IMD_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const res = request.result;
      if (res && res.length > 0) {
        resolve(res);
      } else {
        resolve(INITIAL_IMD_ALERTS);
      }
    };
    request.onerror = (e: any) => reject(e.target.error);
  });
}

export interface GroupSnapshot {
  user: string;
  km: number;
  uscite: number;
  updatedAt: string;
}

const STORAGE_KEY = 'jarvis-group-snapshots';

function readStored(): GroupSnapshot[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GroupSnapshot[]) : [];
  } catch {
    return [];
  }
}

function writeStored(data: GroupSnapshot[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveGroupSnapshot(snapshot: GroupSnapshot) {
  const current = readStored().filter((item) => item.user !== snapshot.user);
  current.push(snapshot);
  writeStored(current);
}

export function readGroupSnapshots(): GroupSnapshot[] {
  return readStored();
}

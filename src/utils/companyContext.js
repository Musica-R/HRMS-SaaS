// src/utils/companyContext.js
import { useSyncExternalStore } from 'react';

const EVENT_NAME = 'company-branch-changed';

function readFromStorage() {
    try {
        const stored = localStorage.getItem('user');
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                company_id: parsed?.company_id ?? '',
                branch_id: parsed?.branch_id ?? '',
                shift_id: parsed?.shift_id ?? '',
                shift: parsed?.shift ?? '',
            };
        }
    } catch (e) {
        console.error('Error reading company/branch/shift from localStorage', e);
    }
    return { company_id: '', branch_id: '', shift_id: '', shift: '' };
}

let cache = readFromStorage();

function subscribe(callback) {
    window.addEventListener(EVENT_NAME, callback);
    window.addEventListener('storage', callback);
    return () => {
        window.removeEventListener(EVENT_NAME, callback);
        window.removeEventListener('storage', callback);
    };
}

function getSnapshot() {
    return cache;
}

export const setCompanyBranch = ({ company_id, branch_id }) => {
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    // shifts are branch-specific, so reset the selected shift whenever branch changes
    const updated = { ...stored, company_id, branch_id, shift_id: '', shift: '' };
    localStorage.setItem('user', JSON.stringify(updated));
    cache = { ...cache, company_id, branch_id, shift_id: '', shift: '' };
    window.dispatchEvent(new Event(EVENT_NAME));
};

export const setShift = ({ shift_id, shift }) => {
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    const updated = { ...stored, shift_id, shift };
    localStorage.setItem('user', JSON.stringify(updated));
    cache = { ...cache, shift_id, shift };
    window.dispatchEvent(new Event(EVENT_NAME));
};

// ── actual hook definition — name starts with "use", satisfies eslint ──
export function useCompanyBranch() {
    return useSyncExternalStore(subscribe, getSnapshot);
}

// ── alias export so all 20+ existing files keep working unchanged ──
export const getCompanyBranch = useCompanyBranch;
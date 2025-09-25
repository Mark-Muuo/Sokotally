const STORAGE_KEY = 'sokotally_transactions_v1';

export function loadTransactions() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch (e) {
		console.warn('Failed to load transactions from storage', e);
		return [];
	}
}

export function saveTransactions(transactions) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
	} catch (e) {
		console.warn('Failed to save transactions to storage', e);
	}
}

export function clearTransactions() {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch (e) {
		console.warn('Failed to clear transactions from storage', e);
	}
}



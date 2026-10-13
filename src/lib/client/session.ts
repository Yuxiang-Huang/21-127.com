export type SessionUser = {
	fullName?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	username?: string | null;
	primaryEmailAddress?: { emailAddress?: string | null } | null;
};

type ClerkClient = {
	user?: SessionUser | null;
	addListener?: (
		listener: (resources: { user?: SessionUser | null }) => void,
	) => void;
};

const listeners = new Set<(user: SessionUser | null) => void>();
let current: SessionUser | null | undefined;
let binding = false;

export function displayName(user: SessionUser): string {
	return (
		user.fullName ||
		[user.firstName, user.lastName].filter(Boolean).join(" ") ||
		user.username ||
		user.primaryEmailAddress?.emailAddress ||
		""
	);
}

export function onSession(fn: (user: SessionUser | null) => void) {
	listeners.add(fn);
	if (current !== undefined) fn(current);
	ensureBound();
}

function clerkOn() {
	return (window as Window & { Clerk?: ClerkClient }).Clerk;
}

function emit(user: SessionUser | null) {
	current = user;
	for (const fn of listeners) fn(user);
}

function ensureBound() {
	if (current !== undefined || binding) return;
	const clerk = clerkOn();
	if (!clerk?.addListener) {
		binding = true;
		const timer = window.setInterval(() => {
			const ready = clerkOn();
			if (!ready?.addListener) return;
			window.clearInterval(timer);
			ready.addListener(({ user }) => emit(user ?? null));
			emit(ready.user ?? null);
		}, 100);
		window.setTimeout(() => window.clearInterval(timer), 10000);
		return;
	}
	clerk.addListener(({ user }) => emit(user ?? null));
	emit(clerk.user ?? null);
}

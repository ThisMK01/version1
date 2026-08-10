const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type EventItem = {
	_id: string;
	title: string;
	gameName: string;
	startDate: string;
	endDate?: string;
	track: string;
	description: string;
	prizePool?: string;
	cardimage?: string;
	numberOfDrivers?: number;
	numberOfregistrations?: number;
	classes?: string[];
};

export type EventForm = Omit<EventItem, "_id">;

export type CarClass = {
	_id: string;
	game: string;
	code: string;
	name: string;
	description?: string;
	active?: boolean;
};

export type Car = {
	_id: string;
	game: string;
	carModelId: number;
	name: string;
	category: string;
};

async function readResponse(response: Response) {
	const contentType = response.headers.get("content-type") || "";
	const body = await response.text();

	if (!contentType.includes("application/json")) {
		throw new Error(`Events API returned ${response.status} ${response.statusText}. Check that the backend is running at ${API_URL}.`);
	}

	const data = JSON.parse(body) as {
		events?: EventItem[];
		message?: string;
		imageUrl?: string;
		carClasses?: CarClass[];
		cars?: Car[];
	};
	if (!response.ok) {
		throw new Error(data.message || "Event request failed");
	}

	return data;
}

function getApiUrl() {
	if (!API_URL) {
		throw new Error("NEXT_PUBLIC_API_URL is not configured");
	}

	return API_URL;
}

function getAuthHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
	const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
	return {
		...additionalHeaders,
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};
}

export async function getEvents(): Promise<EventItem[]> {
	const response = await fetch(`${getApiUrl()}/events`);
	const data = await readResponse(response);
	return data.events || [];
}

export async function getCarClasses(game: string): Promise<CarClass[]> {
	const response = await fetch(`${getApiUrl()}/carclasses?game=${encodeURIComponent(game)}`);
	const data = await readResponse(response);
	return data.carClasses || [];
}

export async function getCars(game: string, carClass: string): Promise<Car[]> {
	const params = new URLSearchParams({ game, class: carClass });
	const response = await fetch(`${getApiUrl()}/cars?${params.toString()}`);
	const data = await readResponse(response);
	return data.cars || [];
}

export type EventRegistration = {
	eventId: string;
	firstName: string;
	lastName: string;
	carModelId: number;
	carNumber: number;
	category: string;
	nationality?: number | string;
};

export async function registerForEvent(registration: EventRegistration) {
	const response = await fetch(`${getApiUrl()}/usereventregistration`, {
		method: "POST",
		headers: getAuthHeaders({ "Content-Type": "application/json" }),
		credentials: "include",
		body: JSON.stringify(registration),
	});

	return readResponse(response);
}

export async function getEventRegistrations(eventId: string): Promise<{ users: any[]; takenCarNumbers: number[] }> {
	const response = await fetch(`${getApiUrl()}/usereventregistration/${eventId}`);
	const contentType = response.headers.get("content-type") || "";
	if (!contentType.includes("application/json")) {
		return { users: [], takenCarNumbers: [] };
	}
	const body = await response.text();
	if (!response.ok) return { users: [], takenCarNumbers: [] };
	return JSON.parse(body);
}

export async function uploadEventImage(file: File): Promise<string> {
	const formData = new FormData();
	formData.append("image", file);

	const response = await fetch(`${getApiUrl()}/events/test-upload`, {
		method: "POST",
		headers: getAuthHeaders(),
		credentials: "include",
		body: formData,
	});
	const data = await readResponse(response);
	const imageUrl = data.imageUrl;

	if (!imageUrl) {
		throw new Error("Image upload succeeded but the API did not return an image URL");
	}

	return imageUrl;
}

export async function createEvent(eventData: EventForm) {
	const response = await fetch(`${getApiUrl()}/events`, {
		method: "POST",
		headers: getAuthHeaders({ "Content-Type": "application/json" }),
		credentials: "include",
		body: JSON.stringify(eventData),
	});

	return readResponse(response);
}

export async function updateEvent(eventId: string, updates: Partial<EventForm>) {
	const response = await fetch(`${getApiUrl()}/events/${eventId}`, {
		method: "PUT",
		headers: getAuthHeaders({ "Content-Type": "application/json" }),
		credentials: "include",
		body: JSON.stringify(updates),
	});

	return readResponse(response);
}

export type AccEntryList = {
	entries: Array<{
		raceNumber: number;
		forcedCarModel: number;
		overrideDriverInfo: number;
		isServerAdmin: number;
		drivers: Array<{
			firstName: string;
			lastName: string;
			shortName: string;
			driverCategory: number;
			nationality: number;
		}>;
	}>;
	forceEntryList: number;
};

export async function getAccEntryList(eventId: string): Promise<AccEntryList> {
	const response = await fetch(`${getApiUrl()}/events/${eventId}/entrylist`);
	const body = await response.text();
	if (!response.ok) {
		throw new Error("Failed to fetch ACC entrylist.json");
	}
	return JSON.parse(body) as AccEntryList;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export type PollOption = {
	_id: string;
	track: string;
	voteCount: number;
	percentage: number;
};

export type PollItem = {
	_id: string;
	title: string;
	gameName: string;
	status: "active" | "closed";
	createdBy: string;
	expiresAt?: string | null;
	createdAt: string;
	totalVotes: number;
	userVotedTrack?: string | null;
	options: PollOption[];
};

function getApiUrl(): string {
	if (API_URL) return API_URL;
	if (typeof window !== "undefined") {
		return `${window.location.protocol}//${window.location.hostname}:5000`;
	}
	return "http://localhost:5000";
}

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
	if (typeof window === "undefined") return extraHeaders;
	const token = localStorage.getItem("auth_token");
	if (!token) return extraHeaders;
	return {
		Authorization: `Bearer ${token}`,
		...extraHeaders,
	};
}

async function readResponse(response: Response) {
	const text = await response.text();
	let data: any = {};
	try {
		data = text ? JSON.parse(text) : {};
	} catch {
		data = { message: text };
	}

	if (!response.ok) {
		throw new Error(data.message || `Request failed with status ${response.status}`);
	}

	return data;
}

export async function getPolls(): Promise<PollItem[]> {
	const response = await fetch(`${getApiUrl()}/polls`, {
		headers: getAuthHeaders(),
		credentials: "include",
	});
	const data = await readResponse(response);
	return data.polls || [];
}

export async function createPoll(pollData: {
	title: string;
	gameName: string;
	tracks: string[];
	expiresAt?: string;
}): Promise<PollItem> {
	const response = await fetch(`${getApiUrl()}/polls`, {
		method: "POST",
		headers: getAuthHeaders({ "Content-Type": "application/json" }),
		credentials: "include",
		body: JSON.stringify(pollData),
	});
	const data = await readResponse(response);
	return data.poll;
}

export async function votePoll(pollId: string, track: string): Promise<PollItem> {
	const response = await fetch(`${getApiUrl()}/polls/${pollId}/vote`, {
		method: "POST",
		headers: getAuthHeaders({ "Content-Type": "application/json" }),
		credentials: "include",
		body: JSON.stringify({ track }),
	});
	const data = await readResponse(response);
	return data.poll;
}

export async function togglePollStatus(pollId: string): Promise<{ status: "active" | "closed" }> {
	const response = await fetch(`${getApiUrl()}/polls/${pollId}/status`, {
		method: "PATCH",
		headers: getAuthHeaders({ "Content-Type": "application/json" }),
		credentials: "include",
	});
	return readResponse(response);
}

export async function deletePoll(pollId: string): Promise<void> {
	const response = await fetch(`${getApiUrl()}/polls/${pollId}`, {
		method: "DELETE",
		headers: getAuthHeaders(),
		credentials: "include",
	});
	await readResponse(response);
}

"use client";

import { useEffect, useState } from "react";
import { Plus, Flag, Trophy, ShieldAlert, CheckCircle2, Lock, Trash2, Clock, Vote, AlertCircle, X, ChevronRight, Filter } from "lucide-react";
import { Button, Card, Chip, ListBox } from "@heroui/react";
import { useAuth } from "../../context/authContext";
import acctracks from "../../tracks/tracks";
import {
	getPolls,
	createPoll,
	votePoll,
	togglePollStatus,
	deletePoll,
	type PollItem,
} from "../../api/poll/poll";
import { io } from "socket.io-client";
import { FloatingInput, FloatingSelect } from "../event/components/EventFormControls";

const gameLogos: Record<string, string> = {
	ACC: "/Game/acc.png",
	iRacing: "/Game/iracing.png",
	LMU: "/Game/tbm.png",
	AC: "/Game/ac.jpg",
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function PollPage() {
	const { user, adminMode } = useAuth();
	const canManagePolls = adminMode;

	const [polls, setPolls] = useState<PollItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

	// Filters
	const [gameFilter, setGameFilter] = useState("All");
	const [statusFilter, setStatusFilter] = useState("All");

	// Voting & action states
	const [votingPollId, setVotingPollId] = useState<string | null>(null);

	// Create Poll Modal State
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [pollTitle, setPollTitle] = useState("");
	const [pollGame, setPollGame] = useState("ACC");
	const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
	const [expiryDate, setExpiryDate] = useState("");
	const [expiryTime, setExpiryTime] = useState("20:00");
	const [creating, setCreating] = useState(false);

	const loadAllPolls = async () => {
		try {
			setLoading(true);
			const data = await getPolls();
			setPolls(data);
			setError("");
		} catch (err) {
			console.error("Failed to load polls:", err);
			setError(err instanceof Error ? err.message : "Failed to load polls.");
		} finally {
			setLoading(false);
		}
	};

	const refreshPollsSilently = async () => {
		try {
			const data = await getPolls();
			setPolls(data);
		} catch {
			// Silent background refresh error catch
		}
	};

	useEffect(() => {
		void loadAllPolls();
		const interval = setInterval(() => {
			void refreshPollsSilently();
		}, 3000);
		return () => clearInterval(interval);
	}, []);

	// Real-time WebSocket connection for live instant updates across all users!
	useEffect(() => {
		const socket = io(API_BASE_URL, {
			transports: ["websocket", "polling"],
			withCredentials: true,
		});

		socket.on("connect", () => {
			console.log("⚡ Connected to live Poll WebSockets");
		});

		socket.on("poll_updated", (data: any) => {
			if (!data || !data.pollId) return;

			setPolls((prev) =>
				prev.map((p) => {
					if (p._id !== data.pollId) return p;

					// If raw options are broadcast with voter arrays:
					if (Array.isArray(data.options)) {
						let totalVotes = 0;
						let userVotedTrack: string | null = null;

						const optionsWithCounts = data.options.map((opt: any) => {
							const votersList = Array.isArray(opt.voters) ? opt.voters.map(String) : [];
							const voteCount = votersList.length;
							totalVotes += voteCount;

							if (user?.steamId && votersList.includes(String(user.steamId))) {
								userVotedTrack = opt.track;
							}

							return {
								_id: String(opt._id),
								track: String(opt.track),
								voteCount,
							};
						});

						const optionsWithPercent = optionsWithCounts.map((opt: { _id: string; track: string; voteCount: number }) => ({
							...opt,
							percentage: totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0,
						}));

						return {
							...p,
							title: data.title || p.title,
							gameName: data.gameName || p.gameName,
							status: data.status || p.status,
							totalVotes,
							userVotedTrack: userVotedTrack !== null ? userVotedTrack : p.userVotedTrack,
							options: optionsWithPercent,
						};
					}

					// Fallback if structured poll item is sent
					if (data.poll) {
						return {
							...data.poll,
							userVotedTrack: p.userVotedTrack,
						};
					}

					return p;
				})
			);
		});

		socket.on("poll_created", (data: { poll: PollItem }) => {
			if (data.poll) {
				setPolls((prev) => [data.poll, ...prev.filter((p) => p._id !== data.poll._id)]);
			}
		});

		socket.on("poll_deleted", (data: { pollId: string }) => {
			if (data.pollId) {
				setPolls((prev) => prev.filter((p) => p._id !== data.pollId));
			}
		});

		return () => {
			socket.disconnect();
		};
	}, [user?.steamId]);

	// Toast auto-clear
	useEffect(() => {
		if (toast) {
			const timer = setTimeout(() => setToast(null), 4000);
			return () => clearTimeout(timer);
		}
	}, [toast]);

	// Tracks list per game
	const availableTracks = pollGame === "ACC" ? Object.keys(acctracks) : [];

	const toggleTrackSelection = (track: string) => {
		setSelectedTracks((prev) =>
			prev.includes(track) ? prev.filter((t) => t !== track) : [...prev, track]
		);
	};

	const selectAllTracks = () => {
		setSelectedTracks(availableTracks);
	};

	const clearSelectedTracks = () => {
		setSelectedTracks([]);
	};

	const openCreatePollModal = () => {
		setPollTitle("");
		setPollGame("ACC");
		setSelectedTracks([]);
		setExpiryDate("");
		setExpiryTime("20:00");
		setError("");
		setShowCreateModal(true);
	};

	const handleCreatePollSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!canManagePolls) return;

		if (!pollTitle.trim()) {
			const msg = "Poll title is required.";
			setError(msg);
			setToast({ message: msg, type: "error" });
			return;
		}

		if (selectedTracks.length < 2) {
			const msg = "Please select at least 2 tracks for users to vote on.";
			setError(msg);
			setToast({ message: msg, type: "error" });
			return;
		}

		let expiresAtIso: string | undefined = undefined;
		if (expiryDate) {
			const dateStr = `${expiryDate}T${expiryTime || "20:00"}`;
			const d = new Date(dateStr);
			if (!isNaN(d.getTime())) {
				expiresAtIso = d.toISOString();
			}
		}

		try {
			setCreating(true);
			setError("");
			await createPoll({
				title: pollTitle.trim(),
				gameName: pollGame,
				tracks: selectedTracks,
				expiresAt: expiresAtIso,
			});

			setToast({ message: "Track poll created successfully!", type: "success" });
			setShowCreateModal(false);
			await loadAllPolls();
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to create poll.";
			setError(msg);
			setToast({ message: msg, type: "error" });
		} finally {
			setCreating(false);
		}
	};

	const handleVote = async (pollId: string, track: string) => {
		try {
			setVotingPollId(pollId);
			const updatedPoll = await votePoll(pollId, track);

			setPolls((prev) =>
				prev.map((p) => (p._id === pollId ? updatedPoll : p))
			);

			setToast({ message: `🎉 Vote recorded for ${track}!`, type: "success" });
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to record vote.";
			setToast({ message: msg, type: "error" });
		} finally {
			setVotingPollId(null);
		}
	};

	const handleToggleStatus = async (pollId: string) => {
		if (!canManagePolls) return;
		try {
			const res = await togglePollStatus(pollId);
			setPolls((prev) =>
				prev.map((p) => (p._id === pollId ? { ...p, status: res.status } : p))
			);
			setToast({ message: `Poll status updated to ${res.status.toUpperCase()}`, type: "success" });
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to update poll status.";
			setToast({ message: msg, type: "error" });
		}
	};

	const handleDeletePoll = async (pollId: string) => {
		if (!canManagePolls) return;
		if (!confirm("Are you sure you want to delete this poll? This cannot be undone.")) return;

		try {
			await deletePoll(pollId);
			setPolls((prev) => prev.filter((p) => p._id !== pollId));
			setToast({ message: "Poll deleted successfully.", type: "success" });
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to delete poll.";
			setToast({ message: msg, type: "error" });
		}
	};

	// Filtered Polls
	const filteredPolls = polls.filter((p) => {
		const matchesGame = gameFilter === "All" || p.gameName === gameFilter;
		const matchesStatus =
			statusFilter === "All" ||
			(statusFilter === "Active" && p.status === "active") ||
			(statusFilter === "Closed" && p.status === "closed");
		return matchesGame && matchesStatus;
	});

	return (
		<main className="relative min-h-screen bg-[#0e131f] text-[#dee2f3] py-12 px-6 lg:px-12">
			{/* Toast Notification */}
			{toast && (
				<div
					className={`fixed top-5 right-5 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl border font-mono-data text-xs shadow-2xl backdrop-blur-md transition-all duration-300 ${
						toast.type === "error"
							? "bg-red-950/90 border-red-500/50 text-red-200"
							: "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
					}`}
				>
					<span className={`w-2.5 h-2.5 rounded-full ${toast.type === "error" ? "bg-red-400 animate-ping" : "bg-emerald-400"}`} />
					<span>{toast.message}</span>
					<button type="button" onClick={() => setToast(null)} className="ml-2 text-zinc-400 hover:text-white">
						<X className="w-3.5 h-3.5" />
					</button>
				</div>
			)}

			<div className="max-w-6xl mx-auto space-y-8">
				{/* Top Header & Admin Action */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
					<div>
						<div className="flex items-center gap-2 text-cyan-400 font-mono-data text-xs font-bold uppercase tracking-widest mb-1">
							<Vote className="w-4 h-4 text-cyan-400 animate-pulse" />
							<span>COMMUNITY TRACK VOTING</span>
						</div>
						<h1 className="font-sora text-3xl font-black text-white tracking-tight">
							Race Track Polls
						</h1>
						<p className="text-zinc-400 text-sm mt-1">
							Cast your vote for upcoming race tracks, layouts, and weekend events.
						</p>
					</div>

					{canManagePolls && (
						<Button
							onPress={openCreatePollModal}
							className="bg-cyan-400 text-slate-950 font-sora font-extrabold text-xs px-6 py-3 rounded-full glow-hover shadow-[0_0_20px_rgba(0,217,255,0.4)] flex items-center gap-2 shrink-0 self-start sm:self-auto"
						>
							<Plus className="w-4 h-4 stroke-[3]" />
							<span>CREATE NEW POLL</span>
						</Button>
					)}
				</div>

				{/* Filter Toolbar */}
				<div className="flex flex-wrap items-center justify-between gap-4 bg-[#0a1020]/80 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
					{/* Game Filters */}
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-zinc-400 font-mono-data text-xs flex items-center gap-1 mr-1">
							<Filter className="w-3.5 h-3.5 text-cyan-400" />
							<span>GAME:</span>
						</span>
						{["All", "ACC", "LMU", "iRacing", "AC"].map((game) => (
							<button
								key={game}
								type="button"
								onClick={() => setGameFilter(game)}
								className={`px-3 py-1.5 rounded-full font-mono-data text-xs font-bold transition-all ${
									gameFilter === game
										? "bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(0,217,255,0.4)]"
										: "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/10"
								}`}
							>
								{game}
							</button>
						))}
					</div>

					{/* Status Filters */}
					<div className="flex items-center gap-2">
						<span className="text-zinc-400 font-mono-data text-xs mr-1">STATUS:</span>
						{["All", "Active", "Closed"].map((status) => (
							<button
								key={status}
								type="button"
								onClick={() => setStatusFilter(status)}
								className={`px-3 py-1.5 rounded-full font-mono-data text-xs font-bold transition-all ${
									statusFilter === status
										? "bg-white text-slate-950 font-extrabold"
										: "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/10"
								}`}
							>
								{status === "Active" ? "🔴 LIVE" : status === "Closed" ? "🔒 CLOSED" : "ALL"}
							</button>
						))}
					</div>
				</div>

				{/* Poll List */}
				{loading ? (
					<div className="py-20 text-center font-mono-data text-sm text-cyan-400 flex items-center justify-center gap-2">
						<span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
						<span>LOADING COMMUNITY POLLS...</span>
					</div>
				) : filteredPolls.length === 0 ? (
					<Card className="bg-[#0e1628] border border-white/10 p-12 text-center rounded-2xl">
						<Vote className="w-10 h-10 text-cyan-400/40 mx-auto mb-3" />
						<h3 className="font-sora text-lg font-bold text-white mb-1">No Polls Available</h3>
						<p className="font-mono-data text-zinc-400 text-sm max-w-md mx-auto">
							{gameFilter !== "All" || statusFilter !== "All"
								? "No polls match your selected filter criteria. Try clearing filters."
								: "There are currently no active polls. Check back soon for upcoming race track votes!"}
						</p>
					</Card>
				) : (
					<div className="grid gap-6 grid-cols-1">
						{filteredPolls.map((poll) => {
							const isClosed = poll.status === "closed";
							const isVoting = votingPollId === poll._id;

							// Find winner track option if closed
							let winningTrack: string | null = null;
							if (isClosed && poll.totalVotes > 0) {
								const maxVotes = Math.max(...poll.options.map((o) => o.voteCount));
								if (maxVotes > 0) {
									winningTrack = poll.options.find((o) => o.voteCount === maxVotes)?.track || null;
								}
							}

							return (
								<Card
									key={poll._id}
									className={`bg-[#0e1628] rounded-2xl border transition-all duration-300 p-6 shadow-2xl space-y-6 ${
										isClosed
											? "border-white/10 opacity-90"
											: "border-white/10 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(0,217,255,0.15)]"
									}`}
								>
									{/* Poll Card Header */}
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
										<div className="flex items-center gap-3">
											<img
												src={gameLogos[poll.gameName] || "/Game/acc.png"}
												alt={poll.gameName}
												className="w-10 h-10 object-contain rounded-lg bg-black/40 p-1 border border-white/10 shrink-0"
											/>
											<div>
												<div className="flex items-center gap-2">
													<span className="font-mono-data text-[11px] font-bold text-cyan-400 uppercase tracking-widest">
														{poll.gameName} POLL
													</span>
													{isClosed ? (
														<span className="rounded-full bg-zinc-800 border border-zinc-600 text-zinc-300 px-2 py-0.5 font-mono-data text-[10px] font-bold flex items-center gap-1">
															<Lock className="w-3 h-3" />
															<span>CLOSED</span>
														</span>
													) : (
														<span className="rounded-full bg-red-600/90 border border-red-400/70 text-white px-2 py-0.5 font-mono-data text-[10px] font-bold animate-pulse flex items-center gap-1 shadow-md">
															<span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
															<span>LIVE VOTING</span>
														</span>
													)}
												</div>
												<h3 className="font-sora text-xl font-bold text-white mt-0.5">
													{poll.title}
												</h3>
											</div>
										</div>

										<div className="flex items-center gap-3 self-end sm:self-auto">
											<div className="text-right">
												<span className="font-mono-data text-xs font-bold text-cyan-300 block">
													📊 {poll.totalVotes} Total {poll.totalVotes === 1 ? "Vote" : "Votes"}
												</span>
												{poll.userVotedTrack && (
													<span className="text-[10px] font-mono-data text-emerald-400 font-semibold block">
														You voted: {poll.userVotedTrack}
													</span>
												)}
											</div>

											{/* Admin Action Controls */}
											{canManagePolls && (
												<div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
													<Button
														size="sm"
														variant="outline"
														onPress={() => handleToggleStatus(poll._id)}
														className={`font-mono-data text-xs px-3 py-1 rounded-full border ${
															isClosed
																? "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
																: "border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
														}`}
													>
														{isClosed ? "REOPEN" : "CLOSE"}
													</Button>

													<button
														type="button"
														onClick={() => handleDeletePoll(poll._id)}
														className="p-1.5 rounded-full text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
														title="Delete Poll"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											)}
										</div>
									</div>

									{/* Track Options Voting List */}
									<div className="space-y-3.5">
										{poll.options.map((option) => {
											const isUserChoice = poll.userVotedTrack === option.track;
											const isWinner = isClosed && winningTrack === option.track;

											return (
												<div
													key={option._id}
													className={`relative rounded-xl border p-4 transition-all duration-200 overflow-hidden ${
														isUserChoice
															? "border-cyan-400 bg-cyan-950/20 shadow-[0_0_15px_rgba(0,217,255,0.2)]"
															: isWinner
															? "border-amber-400/80 bg-amber-950/20"
															: "border-white/10 bg-white/[0.02] hover:border-white/20"
													}`}
												>
													{/* Background Animated Progress Bar */}
													<div
														className={`absolute left-0 top-0 bottom-0 transition-all duration-500 pointer-events-none opacity-20 ${
															isUserChoice
																? "bg-cyan-400"
																: isWinner
																? "bg-amber-400"
																: "bg-cyan-500"
														}`}
														style={{ width: `${option.percentage}%` }}
													/>

													<div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
														{/* Track Details */}
														<div className="flex items-center gap-3">
															<div
																className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
																	isWinner
																		? "bg-amber-400/20 border-amber-400 text-amber-300"
																		: isUserChoice
																		? "bg-cyan-400/20 border-cyan-400 text-cyan-300"
																		: "bg-black/40 border-white/10 text-zinc-400"
																}`}
															>
																{isWinner ? (
																	<Trophy className="w-4 h-4 text-amber-400" />
																) : (
																	<Flag className="w-4 h-4" />
																)}
															</div>

															<div>
																<div className="flex items-center gap-2">
																	<span className="font-sora font-bold text-base text-white">
																		{option.track}
																	</span>
																	{isWinner && (
																		<span className="rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-[10px] font-mono-data font-bold px-2 py-0.5 flex items-center gap-1">
																			<Trophy className="w-3 h-3 text-amber-400" />
																			<span>WINNER</span>
																		</span>
																	)}
																</div>

																{/* Percentage & Vote Count */}
																<div className="flex items-center gap-2 mt-0.5">
																	<span className="font-mono-data text-xs font-bold text-cyan-300">
																		{option.percentage}%
																	</span>
																	<span className="text-zinc-500 text-xs">•</span>
																	<span className="font-mono-data text-xs text-zinc-400">
																		{option.voteCount} {option.voteCount === 1 ? "vote" : "votes"}
																	</span>
																</div>
															</div>
														</div>

														{/* Action / Status Button */}
														<div>
															{isUserChoice ? (
																<div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 px-4 py-1.5 font-mono-data text-xs font-bold text-emerald-300 shadow-md">
																	<CheckCircle2 className="w-4 h-4 text-emerald-400" />
																	<span>YOUR VOTE</span>
																</div>
															) : isClosed ? (
																<span className="font-mono-data text-xs font-semibold text-zinc-500">
																	Final Result
																</span>
															) : (
																<Button
																	size="sm"
																	isDisabled={isVoting}
																	onPress={() => handleVote(poll._id, option.track)}
																	className="bg-cyan-400/10 border border-cyan-400/40 hover:bg-cyan-400 hover:text-slate-950 text-cyan-300 font-mono-data text-xs font-bold px-4 py-1.5 rounded-full transition-all"
																>
																	<span>{poll.userVotedTrack ? "SWITCH VOTE" : "VOTE TRACK"}</span>
																	<ChevronRight className="w-3.5 h-3.5" />
																</Button>
															)}
														</div>
													</div>
												</div>
											);
										})}
									</div>
								</Card>
							);
						})}
					</div>
				)}
			</div>

			{/* Create Poll Modal (Admin) */}
			{canManagePolls && showCreateModal && (
				<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md overflow-y-auto">
					<div className="flex min-h-full items-start justify-center px-4 py-8">
						<form
							onSubmit={handleCreatePollSubmit}
							className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e1628] p-6 sm:p-8 shadow-2xl space-y-6 my-auto"
						>
							{/* Header */}
							<div className="flex items-center justify-between border-b border-white/10 pb-4">
								<div>
									<span className="font-mono-data text-xs font-bold text-cyan-400 uppercase">
										ADMIN CONTROL
									</span>
									<h2 className="font-sora text-xl font-bold text-white">Create Race Track Poll</h2>
								</div>
								<button
									type="button"
									onClick={() => setShowCreateModal(false)}
									className="rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
								>
									<X className="w-5 h-5" />
								</button>
							</div>

							{/* In-Form Error Alert */}
							{error && (
								<div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-red-300 text-xs font-mono-data flex items-center justify-between gap-2 shadow-lg animate-pulse">
									<div className="flex items-center gap-2">
										<AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
										<span>{error}</span>
									</div>
									<button type="button" onClick={() => setError("")} className="text-red-400 hover:text-white">
										<X className="w-4 h-4" />
									</button>
								</div>
							)}

							<div className="space-y-4">
								{/* Poll Title */}
								<FloatingInput
									required
									label="Poll Title"
									value={pollTitle}
									onChange={(e) => setPollTitle(e.target.value)}
									placeholder="e.g. Endurance Championship Round 4 - Track Selection"
								/>

								{/* Select Game */}
								<FloatingSelect
									label="Select Game"
									selectedKey={pollGame}
									onSelectionChange={(key) => {
										setPollGame(String(key));
										setSelectedTracks([]);
									}}
								>
									<ListBox.Item id="ACC">ACC</ListBox.Item>
									<ListBox.Item id="LMU">LMU</ListBox.Item>
									<ListBox.Item id="iRacing">iRacing</ListBox.Item>
									<ListBox.Item id="AC">AC</ListBox.Item>
								</FloatingSelect>

								{/* Select Tracks Section */}
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<span className="font-mono-data text-xs font-bold text-cyan-400 uppercase">
											SELECT TRACKS ({selectedTracks.length} selected, min 2)
										</span>
										<div className="flex items-center gap-2 text-[11px] font-mono-data">
											<button
												type="button"
												onClick={selectAllTracks}
												className="text-cyan-300 hover:underline"
											>
												Select All
											</button>
											<span className="text-zinc-600">•</span>
											<button
												type="button"
												onClick={clearSelectedTracks}
												className="text-zinc-400 hover:underline"
											>
												Clear
											</button>
										</div>
									</div>

									{/* Track Checklist */}
									{availableTracks.length > 0 ? (
										<div className="bg-black/40 rounded-xl border border-white/10 p-3 max-h-56 overflow-y-auto space-y-1.5">
											{availableTracks.map((track) => {
												const isSelected = selectedTracks.includes(track);
												return (
													<button
														key={track}
														type="button"
														onClick={() => toggleTrackSelection(track)}
														className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left font-mono-data text-xs transition-all ${
															isSelected
																? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold"
																: "bg-white/[0.02] border-white/5 text-zinc-300 hover:bg-white/5"
														}`}
													>
														<div className="flex items-center gap-2">
															<Flag className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
															<span>{track}</span>
														</div>
														<div
															className={`w-4 h-4 rounded border flex items-center justify-center ${
																isSelected
																	? "bg-cyan-400 border-cyan-400 text-slate-950"
																	: "border-white/20"
															}`}
														>
															{isSelected && <span className="font-bold text-[10px]">✓</span>}
														</div>
													</button>
												);
											})}
										</div>
									) : (
										<div className="bg-black/40 rounded-xl border border-white/10 p-6 text-center text-zinc-400 font-mono-data text-xs flex flex-col items-center justify-center gap-1">
											<AlertCircle className="w-5 h-5 text-amber-400 mb-1" />
											<span className="font-bold text-amber-300">No tracks available</span>
											<span className="text-[11px] text-zinc-500">Tracks for {pollGame} have not been added to the system yet.</span>
										</div>
									)}
								</div>

								{/* Expiration Date (Optional) */}
								<div className="space-y-2 pt-2 border-t border-white/10">
									<span className="font-mono-data text-xs font-bold text-zinc-400 uppercase block">
										POLL CLOSURE DATE (OPTIONAL)
									</span>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<FloatingInput
											type="date"
											label="Closing Date"
											value={expiryDate}
											onChange={(e) => setExpiryDate(e.target.value)}
										/>
										<FloatingInput
											type="time"
											label="Closing Time"
											value={expiryTime}
											onChange={(e) => setExpiryTime(e.target.value)}
										/>
									</div>
								</div>
							</div>

							{/* Actions */}
							<div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
								<Button
									type="button"
									variant="outline"
									onPress={() => setShowCreateModal(false)}
									className="border-white/20 text-zinc-300 font-mono-data text-xs py-2.5 px-6 rounded-full hover:bg-white/10"
								>
									CANCEL
								</Button>
								<Button
									type="submit"
									isDisabled={creating || !pollTitle.trim() || selectedTracks.length < 2}
									className="bg-cyan-400 text-slate-950 font-sora font-bold text-xs py-2.5 px-6 rounded-full glow-hover"
								>
									{creating ? "CREATING POLL..." : "CONFIRM & CREATE POLL"}
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}
		</main>
	);
}

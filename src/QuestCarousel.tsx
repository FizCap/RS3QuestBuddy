// QuestCarousel.tsx
import React, { useEffect, useRef, useState } from "react";
import { Carousel } from "@mantine/carousel";
import { Button, TextInput, Tooltip, Loader } from "@mantine/core";
import "@mantine/core/styles/UnstyledButton.css";
import "@mantine/core/styles/Button.css";
import "@mantine/core/styles/Input.css";
import "./index.css";
import { useQuestListStore, QuestListFetcher } from "./Fetchers/FetchQuestList";
import { NavLink } from "react-router-dom";
import { IconArrowRight, IconArrowLeft } from "@tabler/icons-react";
import { PlayerQuests, usePlayerStore } from "./Handlers/PlayerFetch";
import { rsQuestSorter } from "./Handlers/SortPlayerData";
const QuestCarousel: React.FC = () => {
	const [focused, setFocused] = useState(false);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const playerfetch = new PlayerQuests();
	const returningPName = useRef<string>("");
	let playerName = returningPName.current;
	const playerFound = useRef<boolean>(false);
	const sorted = useRef<boolean>(false);
	const questList = useQuestListStore().questlist;
	const remainingQuests = useRef<string[] | null>(null);
	const rsSorter = new rsQuestSorter();
	const rsUserQuestProfile = usePlayerStore.getState().playerQuestInfo;
	const [searchInitiated, setSearchInitiated] = useState(false);
	const [questPoints, setQuestPoints] = useState(0);
	const alreadySorted = useRef<boolean>(false);
	const filteredQuests = questList.filter((quest) =>
		quest.toLowerCase().includes(searchQuery.toLowerCase())
	);
	const [skillsApplied, setSkillsApplied] = useState(false);
	const filteredRemainingQuests = sorted.current
		? remainingQuests.current!.filter((quest) =>
				quest.toLowerCase().includes(searchQuery.toLowerCase())
		  )
		: [];
	const handlePlayerLoad = async () => {
		await playerfetch.fetchPlayerInfo(playerName);
	};
	const handleKeyPress = async () => {
		try {
			if (playerName.length > 0) {
				console.log("im here");
				setSearchInitiated(true);
				await playerfetch.fetchPlayerInfo(playerName);
				await playerfetch.fetchPlayerSkills(playerName);
				returningPName.current = playerName;
				if (usePlayerStore.getState().playerReponseOK) {
					console.log();

					playerFound.current = true;
					window.sessionStorage.setItem("playerFound", JSON.stringify(playerFound));
					window.sessionStorage.setItem("playerName", JSON.stringify(playerName));
				}
			} else {
				playerFound.current = false;
			}
		} catch (error) {
			// Handle errors
			console.error("Error fetching player info:", error);
		}
	};

	const renderQuestContent = (quest: string | undefined) => {
		if (quest) {
			let questTEdit = quest.toLowerCase().split(" ");
			let modifiedQuestVal1 = questTEdit.join("").replace(/[!,`']/g, "");
			let questImage = "";

			if (!sorted.current) {
				const pattern = /[^a-zA-Z0-9]/g;
				questImage =
					"./Rewards/" + quest.toLowerCase().replace(pattern, "") + "reward.png";
			} else {
				const pattern = /[^a-zA-Z0-9]/g;
				questImage =
					"./Rewards/" + quest.toLowerCase().replace(pattern, "") + "reward.png";
			}

			return (
				<NavLink
					to={"/QuestPage"}
					state={{
						questName: quest,
						modified: modifiedQuestVal1,
					}}
					style={{ textDecoration: "none" }}
				>
					<div
						className="caroQTitle"
						aria-label={`Navigate to ${quest}`}
						style={{
							color: sorted.current
								? "#BF2930"
								: playerFound.current
								? "#54B46F"
								: "#4e85bc",
							paddingTop: "30",
						}}
					>
						{quest}
						<img src={questImage} alt="Reward" aria-hidden="true" />
					</div>
				</NavLink>
			);
		}

		return null;
	};
	const sort = () => {
		const resultingQuests = rsSorter.sortNotStartedQuests(rsUserQuestProfile);
		remainingQuests.current = resultingQuests;
		alreadySorted.current = true;
		sorted.current = true;
		window.sessionStorage.setItem(
			"alreadySorted",
			JSON.stringify(alreadySorted.current)
		);
		window.sessionStorage.setItem("sorted", JSON.stringify(sorted.current));
	};

	const unSort = () => {
		alreadySorted.current = false;
		sorted.current = false;
		window.sessionStorage.setItem(
			"alreadySorted",
			JSON.stringify(alreadySorted.current)
		);
		window.sessionStorage.setItem("sorted", JSON.stringify(sorted.current));
	};
	const startLoader = () => {
		if (!playerFound.current) {
			while (!usePlayerStore.getState().playerReponseOK) {
				return <Loader size={25} />;
			}
			return;
		}
	};
	const applySkills = () => {
		rsSorter.sortCompletedQuests(rsUserQuestProfile);
		setSkillsApplied(true);
	};
	useEffect(() => {
		console.log("Effect triggered on load");
		const player = sessionStorage.getItem("playerName");
		console.log(player);
		if (player !== null) {
			returningPName.current = player;
			console.log(playerFound);
			handlePlayerLoad();
			playerFound.current = true;
		}
	}, []);
	useEffect(() => {
		const remainQuests = sessionStorage.getItem("remainingQuests");
		const player = sessionStorage.getItem("playerName");
		const qp = sessionStorage.getItem("questPoints");
		const sort = sessionStorage.getItem("sorted");
		const playerF = sessionStorage.getItem("playerFound");
		const alreadyS = sessionStorage.getItem("alreadySorted");
		if (
			remainQuests !== null &&
			player !== null &&
			qp !== null &&
			sort !== null &&
			playerF &&
			alreadyS !== null
		) {
			const parsedQuests: string[] = JSON.parse(remainQuests);
			const parsedSort: boolean = JSON.parse(sort);
			const parsedPlayerF: boolean = JSON.parse(playerF);
			const parsedAlreadySorted: boolean = JSON.parse(alreadyS);
			if (
				parsedQuests !== null &&
				typeof parsedQuests === "object" &&
				Array.isArray(parsedQuests)
			) {
				const qpoint: number = JSON.parse(qp);
				setQuestPoints(qpoint);
				returningPName.current = player;
				sorted.current = parsedSort;
				alreadySorted.current = parsedAlreadySorted;
				remainingQuests.current = parsedQuests;
				playerFound.current = parsedPlayerF;
				applySkills();
			} else {
				console.warn("Invalid or non-array data in sessionStorage");
			}
		} else {
			console.warn("No data found in sessionStorage");
		}
	}, []);
	return (
		<>
			<QuestListFetcher questlist="./questlist.txt" />
			<div className="SearchContainer">
				<div className="PlayerSearch">
					<TextInput
						readOnly={false}
						defaultValue={
							playerFound.current ? returningPName.current.replace(/["]/g, "") : ""
						}
						styles={{
							input: { color: playerFound.current ? "#36935C" : "#933648" },
						}}
						label={"Search for Player Name"}
						placeholder={"Search for Player Name"}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								console.log("Event value:", event.currentTarget.value);
								playerName = event.currentTarget.value;
								console.log("After update:", playerName);
								setFocused(false);
								handleKeyPress();
							}
						}}
						rightSection={searchInitiated ? startLoader() : null}
						onFocus={() => setFocused(true)}
						onBlur={() => setFocused(false)}
						inputContainer={(children) => (
							<Tooltip
								label="Hit Enter, If it looks like its taking a while click in the box"
								position="top-start"
								opened={focused}
							>
								{children}
							</Tooltip>
						)}
					/>
				</div>

				<div className="SearchQuest">
					<TextInput
						className="customInput"
						label="Search for Quest"
						placeholder="Type in a quest"
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.currentTarget.value)}
					/>
				</div>
			</div>
			<div>
				{!alreadySorted.current ? (
					<Button
						className="SortButton"
						variant="outline"
						color="#EEF3FF"
						onClick={() => {
							applySkills();
							sort();

							location.reload();
						}}
						disabled={playerFound.current ? false : true}
					>
						Sort Out Completed Quests
					</Button>
				) : (
					<Button
						className="SortButton"
						variant="outline"
						color="#EEF3FF"
						onClick={() => {
							unSort();
							location.reload();
						}}
						disabled={playerFound.current ? false : true}
					>
						Un-Sort
					</Button>
				)}
				{!skillsApplied && (
					<Button
						className="ApplySkillsButton"
						variant="outline"
						color="#EEF3FF"
						onClick={() => {
							applySkills();
						}}
						disabled={playerFound.current ? false : true}
					>
						Apply Skills Dont Sort
					</Button>
				)}

				<Button
					className="RefreshButton"
					variant="outline"
					color="#EEF3FF"
					onClick={() => {
						sessionStorage.clear();
						localStorage.clear();
						location.reload();
					}}
				>
					New Player Search
				</Button>
			</div>
			{sorted.current && (
				<div className="caroQTitle">
					<h3>Quests have been sorted by quests you can do!</h3>
					<p>
						{returningPName.current} has a total of {questPoints} Quest Points and{" "}
						{remainingQuests.current?.length} remaining quests to Quest Cape!
					</p>
				</div>
			)}
			<div className="caroContainer">
				<Carousel
					speed={100}
					align="start"
					mx="auto"
					withIndicators
					slidesToScroll={1}
					height={400}
					nextControlIcon={<IconArrowRight size={16} />}
					previousControlIcon={<IconArrowLeft size={16} />}
					slideSize="100%"
				>
					{sorted.current &&
						filteredRemainingQuests.map((quest, index) => (
							<Carousel.Slide key={index}>{renderQuestContent(quest)}</Carousel.Slide>
						))}

					{!sorted.current &&
						filteredQuests.map((quest, index) => (
							<Carousel.Slide key={index}>{renderQuestContent(quest)}</Carousel.Slide>
						))}
				</Carousel>
			</div>
		</>
	);
};

export default QuestCarousel;

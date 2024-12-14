import React, { useState, useEffect } from "react";

const Grid: React.FC = () => {
	// Initialize highlighted grid with data from localStorage or default 5x5 grid
	const [highlighted, setHighlighted] = useState<boolean[][]>(() => {
		const savedGrid = localStorage.getItem("highlightedUndergroundGrid");
		return savedGrid
			? JSON.parse(savedGrid)
			: Array(5).fill(Array(5).fill(false));
	});

	// Save the highlighted state to localStorage whenever it changes
	useEffect(() => {
		localStorage.setItem(
			"highlightedUndergroundGrid",
			JSON.stringify(highlighted)
		);
	}, [highlighted]);

	// Toggle cell highlight state
	const handleClick = (row: number, col: number) => {
		setHighlighted((prevGrid) =>
			prevGrid.map((rowArr, rowIndex) =>
				rowIndex === row
					? rowArr.map((cell, colIndex) => (colIndex === col ? !cell : cell))
					: rowArr
			)
		);
	};

	// Clear all highlights
	const clearSelection = () => {
		const emptyGrid = Array(5).fill(Array(5).fill(false));
		setHighlighted(emptyGrid);
		localStorage.removeItem("highlightedUndergroundGrid");
	};

	return (
		<div>
			<p>Dont Worry I'll Remember this until you clear me.</p>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(5, 3.125rem)",
					gap: "0.325rem",
				}}
			>
				{highlighted.map((row, rowIndex) =>
					row.map((cell, colIndex) => (
						<div
							key={`${rowIndex}-${colIndex}`}
							onClick={() => handleClick(rowIndex, colIndex)}
							style={{
								width: "3.125rem",
								height: "3.125rem",
								backgroundColor: cell ? "#4caf50" : "#ddd",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								cursor: "pointer",
								border: "0.0625remsolid #ccc",
							}}
						/>
					))
				)}
			</div>
			<button
				onClick={clearSelection}
				style={{ marginTop: "0.625rem", marginBottom: "0.625rem" }}
			>
				Clear Selection
			</button>
		</div>
	);
};

export default Grid;

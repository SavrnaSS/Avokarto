"use client";

import { CornerDownLeft, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import styles from "./seller.module.css";

export type Command = {
	group: string;
	icon: ComponentType<{ size?: number }>;
	id: string;
	label: string;
	run: () => void;
};

/**
 * ⌘K / Ctrl+K quick actions: jump to any section, search products, copy or
 * open the store. Fully keyboard driven; on phones it opens from the search
 * button as a full-width sheet.
 */
export default function CommandPalette({
	commands,
	onClose,
	onSearch,
	open,
}: {
	commands: Command[];
	onClose: () => void;
	onSearch: (query: string) => void;
	open: boolean;
}) {
	const dialog = useRef<HTMLDialogElement>(null);
	const [query, setQuery] = useState("");
	const [active, setActive] = useState(0);

	useEffect(() => {
		const element = dialog.current;
		if (!element) return;
		if (open && !element.open) element.showModal();
		if (!open && element.open) element.close();
	}, [open]);

	const results = useMemo(() => {
		const needle = query.trim().toLowerCase();
		const matched = needle ? commands.filter((command) => command.label.toLowerCase().includes(needle)) : commands;
		const search: Command[] = needle
			? [{ group: "Search", icon: Search, id: "search", label: `Search products for “${query.trim()}”`, run: () => onSearch(query.trim()) }]
			: [];
		return [...search, ...matched];
	}, [commands, onSearch, query]);

	const choose = (command: Command | undefined) => {
		if (!command) return;
		command.run();
		setQuery("");
		setActive(0);
		onClose();
	};

	let lastGroup = "";
	return (
		<dialog
			aria-label="Quick actions"
			className={styles.palette}
			onClick={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
			onClose={onClose}
			ref={dialog}
		>
			<div className={styles.paletteBox}>
				<label className={styles.paletteSearch}>
					<Search aria-hidden="true" size={18} />
					<input
						aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
						aria-controls="cmd-list"
						autoFocus
						onChange={(event) => {
							setQuery(event.target.value);
							setActive(0);
						}}
						onKeyDown={(event) => {
							if (event.key === "ArrowDown") {
								event.preventDefault();
								setActive((index) => Math.min(results.length - 1, index + 1));
							} else if (event.key === "ArrowUp") {
								event.preventDefault();
								setActive((index) => Math.max(0, index - 1));
							} else if (event.key === "Enter") {
								event.preventDefault();
								choose(results[active]);
							}
						}}
						placeholder="Search products or jump to…"
						role="combobox"
						aria-expanded="true"
						value={query}
					/>
					<kbd>esc</kbd>
				</label>
				<ul className={styles.paletteList} id="cmd-list" role="listbox">
					{results.map((command, index) => {
						const heading = command.group !== lastGroup ? command.group : null;
						lastGroup = command.group;
						return (
							<li key={command.id} role="presentation">
								{heading ? <p className={styles.paletteGroup}>{heading}</p> : null}
								<button
									aria-selected={index === active}
									className={styles.paletteItem}
									id={`cmd-${command.id}`}
									onClick={() => choose(command)}
									onMouseMove={() => setActive(index)}
									role="option"
									type="button"
								>
									<command.icon size={16} />
									<span>{command.label}</span>
									{index === active ? <CornerDownLeft aria-hidden="true" className={styles.paletteEnter} size={14} /> : null}
								</button>
							</li>
						);
					})}
					{!results.length ? <li className={styles.paletteEmpty}>No matches</li> : null}
				</ul>
			</div>
		</dialog>
	);
}

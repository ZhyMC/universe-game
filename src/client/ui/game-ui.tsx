import React, { useEffect, useState } from 'react';

import { Shortcut } from './shortcut';
import { useEventBus, useUIState } from '../../framework/client-side/user-interface/hooks';
import { PlayerState } from '../module/player-module/ui-state';
import { BowUI } from './bow';
import { Backpack } from './backpack';

import './game-ui.css';
import { BuildingCreator } from './building-creator';

export function GameUI(props: any) {
	function onClicked() {
		eventBus.emit('PlayerNameClicked');
	}

	const [backpackVisible, setBackpackVisible] = useState(false);

	useEffect(() => {
		const callback = () => {
			setBackpackVisible(!backpackVisible);
		};
		eventBus.on('toggleBackpack', callback);
		return () => {
			eventBus.off('toggleBackpack', callback);
		};
	}, [backpackVisible]);

	const eventBus = useEventBus();
	const player = useUIState(PlayerState);
	return (
		<div onClick={onClicked}>
			<div id="player-name" style={{ fontSize: '24px', color: 'white' }}>
				{player?.playerName}
			</div>
			<BuildingCreator />
			<Backpack
				visible={backpackVisible}
				onOpenBuildingCreator={() => {
					eventBus.emit('SelectingBuildingRange', 'start');
					setBackpackVisible(false);
				}}
			></Backpack>
			<div id="bottom-area">
				<BowUI></BowUI>
				<Shortcut></Shortcut>
			</div>
		</div>
	);
}

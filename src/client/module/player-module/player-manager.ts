import { Vector2 } from '../../../server/shared/math';
import { HTMLInputProvider, InputKey } from '../../input';
import { ClientSideManager } from '../../../framework/client-side/client-manager';
import { Viewport } from '../../../framework/client-side/viewport/viewport';
import { AttachType } from '../../../server/module/actor-module/spec';
import { inject, injectable } from 'inversify';
import { Player } from './player-object';
import { ActorManager } from '../actor-module/actor-manager';
import * as Events from '../../event/internal';
import { UIEventBus } from '../../../framework/client-side/user-interface/hooks';
import { PlayerState } from './ui-state';

@injectable()
export class PlayerManager extends ClientSideManager {
	public settingAimTarget = false;

	private currentPlayer: Player;

	private lastAimTarget: number;

	constructor(
		@inject(PlayerState) private playerState: PlayerState,
		@inject(HTMLInputProvider) private inputProvider: HTMLInputProvider,
		@inject(Viewport) private stage: Viewport,
		@inject(UIEventBus) private uiEvent: UIEventBus,
		@inject(ActorManager) private actorManager: ActorManager,
	) {
		super();

		this.uiEvent.on('PlayerNameClicked', () => console.log('yes!'));
	}

	setCurrentPlayer(player: Player) {
		this.playerState.actorId = player.getServerId();
		this.playerState.playerName = 'Player';

		player.onEvent(Events.ControlMovedEvent, this.onPlayerControlMoved);
		player.setTakeControl();

		this.currentPlayer = player;
	}

	private onPlayerControlMoved = (event: Events.ControlMovedEvent) => {
		this.emitEvent(Events.ControlMovedEvent, event);
	};

	getCurrentPlayer() {
		return this.currentPlayer;
	}

	isCurrentPlayer(player: Player) {
		return this.currentPlayer === player;
	}

	private doControlMoveTick() {
		const player = this.currentPlayer;
		if (!player) return;

		const moveSpeed = 0.06;

		const upPress = this.inputProvider.keyPress(InputKey.W);
		const downPress = this.inputProvider.keyPress(InputKey.S);
		const leftPress = this.inputProvider.keyPress(InputKey.A);
		const rightPress = this.inputProvider.keyPress(InputKey.D);

		if (upPress && leftPress) {
			player.controlMove(new Vector2(-0.707 * moveSpeed, -0.707 * moveSpeed));
		} else if (upPress && rightPress) {
			player.controlMove(new Vector2(0.707 * moveSpeed, -0.707 * moveSpeed));
		} else if (downPress && leftPress) {
			player.controlMove(new Vector2(-0.707 * moveSpeed, 0.707 * moveSpeed));
		} else if (downPress && rightPress) {
			player.controlMove(new Vector2(0.707 * moveSpeed, 0.707 * moveSpeed));
		} else if (downPress) {
			player.controlMove(new Vector2(0, moveSpeed));
		} else if (leftPress) {
			player.controlMove(new Vector2(-moveSpeed, 0));
		} else if (rightPress) {
			player.controlMove(new Vector2(moveSpeed, 0));
		} else if (upPress) {
			player.controlMove(new Vector2(0, -moveSpeed));
		}

		if (!upPress && !leftPress && !rightPress && !downPress) {
			player.controlMove(false);
		}

		this.stage.moveCenter(player.position.x, player.position.y);
	}

	private doUsingRightHand() {
		const player = this.currentPlayer;
		if (!player) return;
		const rightHand = player.getAttachment(AttachType.RIGHT_HAND);

		if (rightHand) {
			const actor = this.actorManager.getObjectById(rightHand.actorId);

			if (this.inputProvider.cursorPress() || this.inputProvider.keyPress(InputKey.J)) {
				!actor.isUsing && actor.startUsing();
			} else {
				actor.isUsing && actor.endUsing();
			}
		}
	}

	private doSetAimTargetTick(tick: number) {
		if (!this.currentPlayer) return;
		if (!this.settingAimTarget) return;

		const screenPoint = this.inputProvider.getCursorAt();
		const cursorAt = Vector2.fromArray(this.stage.getWorldPointAt(screenPoint.x, screenPoint.y));
		const attachment = this.currentPlayer.getAttachment(AttachType.RIGHT_HAND);
		if (!attachment) return;

		const vPos = this.actorManager.getObjectById(attachment.actorId).vPos;

		const rad = cursorAt.sub(vPos).getRad();

		if (tick % 5 === 0) {
			if (this.lastAimTarget === rad) return;
			this.emitEvent(Events.SetAimTargetEvent, {
				rotation: rad,
			});
			this.lastAimTarget = rad;
		}
	}

	doFixedUpdateTick(tick: number) {
		this.doControlMoveTick();
		this.doUsingRightHand();
		this.doSetAimTargetTick(tick);
	}
}

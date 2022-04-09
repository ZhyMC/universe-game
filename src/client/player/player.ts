import { ActorObject } from '../actor/actor';
import { AckData, EntityState, Input, PredictedInputManager } from '@uni.js/prediction';
import { Vector2 } from '../../server/utils/vector2';
import { ActorType } from '../../server/actor/actor-type';
import { ControlMoveEvent, ControlWalkEvent } from '../../server/event/client';
import type { GameClientApp } from '../client-app';
import { DirectionType, RunningType } from '../../server/actor/actor';
import { Texture, Resource } from 'pixi.js';

const BILLION_VALUE = 10000000;

export interface ControlMoved {
	moved: Vector2;
	startAt: Vector2;
}

export class Player extends ActorObject {
	private _isMaster = false;

	/**
	 * @readonly
	 */
	public playerName: string;

	private controlMoved: Vector2 | false = false;
	private predictedInputMgr: PredictedInputManager;
	private isWalkDirty = false;

	constructor(serverId: number, pos: Vector2, attrs: any, app: GameClientApp) {
		super(serverId, pos, attrs, app);

		this.setShowHealth(true);
		this.setHasShadow(true);

		this.playerName = attrs.playerName;
		this.setTagname(this.playerName);
		
		this.sprite.animationSpeed = 0.12;

		this.setTextures(this.texturesPool);

		if (this.running === undefined) {
			this.controlRunning(RunningType.SILENT);
		}

		if (this.direction === undefined) {
			this.controlDirection(DirectionType.FORWARD);
		}

		this.predictedInputMgr = new PredictedInputManager({ ...this.getPos(), motionX: attrs.motionX, motionY: attrs.motionY });
	}

	private playWalkingAnim() {
		let textures = [];
		if (this.direction === DirectionType.FORWARD) {
			textures = this.texturesPool.slice(0, 3);
		} else if (this.direction === DirectionType.BACK) {
			textures = this.texturesPool.slice(9, 12);
		} else if (this.direction === DirectionType.LEFT) {
			textures = this.texturesPool.slice(3, 6);
		} else {
			textures = this.texturesPool.slice(6, 9);
		}
		this.playAnimate(textures);
	}

	protected getDefaultTexture(): Texture<Resource> {
		if (this.direction === DirectionType.FORWARD) {
			return this.texturesPool[1];
		} else if (this.direction === DirectionType.BACK) {
			return this.texturesPool[10];
		} else if (this.direction === DirectionType.LEFT) {
			return this.texturesPool[4];
		} else {
			return this.texturesPool[7];
		}
	}

	setDirection(direction: DirectionType): boolean {
		const hasChanged = super.setDirection(direction);

		if (hasChanged) {
			this.stopAnimate();
			this.playWalkingAnim();
		}

		return hasChanged;
	}

	setRunning(running: RunningType): boolean {
		const hasChanged = super.setRunning(running);
		if (hasChanged) {
			if (running === RunningType.WALKING) {
				this.stopAnimate();
				this.playWalkingAnim();	
			} else if (running === RunningType.SILENT) {
				this.stopAnimate();
			}
		}
		return hasChanged;
	}

	getType(): ActorType {
		return ActorType.PLAYER;
	}

	controlMove(delta: Vector2 | false) {
		if (delta === false) {
			this.controlMoved = false;
			return;
		}

		this.controlMoved = delta;
	}

	ackInput(ackData: AckData) {
		this.predictedInputMgr.ackInput(ackData);
	}

	private doControlMoveTick(tick: number) {
		if (this.controlMoved) {
			const moved = this.controlMoved;

			this.predictedInputMgr.pendInput({
				moveX: moved.x,
				moveY: moved.y,
			});

			this.controlRunning(RunningType.WALKING);
		}

		if (!this.controlMoved && this.isMaster()) {
			this.controlRunning(RunningType.SILENT);
		}
	}

	isMaster() {
		return this._isMaster;
	}

	setIsMaster() {
		if (this._isMaster) {
			return;
		}

		this._isMaster = true;

		this.predictedInputMgr.on('applyState', (state: EntityState) => {
			this.setPos(new Vector2(state.x, state.y));
		});

		this.predictedInputMgr.on('applyInput', (input: Input) => {
			const event = new ControlMoveEvent();
			event.actorId = this.getServerId();
			event.input = input;
			this.emitEvent(event);
		});
	}

	emitEvent(event: any) {
		this.eventBus.emitBusEvent(event);
	}

	private doOrderTick() {
		this.zIndex = 2 + (this.y / BILLION_VALUE + 1) / 2;
	}

	controlRunning(running: RunningType) {
		if(this.setRunning(running)) {
			this.isWalkDirty = true;
		}			
	}

	controlDirection(direction: DirectionType) {
		if(this.setDirection(direction)) {
			this.isWalkDirty = true;
		}
	}

	doFixedUpdateTick(tick: number) {
		super.doFixedUpdateTick(tick);

		if (this.isMaster()) {
			this.predictedInputMgr.doGameTick();
		}

		if (this.isWalkDirty && this.isMaster()) {
			const event = new ControlWalkEvent();
			event.actorId = this.getServerId();
			event.direction = this.direction;
			event.running = this.running;

			this.eventBus.emitBusEvent(event);
			this.isWalkDirty = false;
		}

		this.doControlMoveTick(tick);
		this.doOrderTick();
	}
}

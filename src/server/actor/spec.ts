import { injectable } from 'inversify';
import { Entity } from '../../shared/database/memory';
import { Factory } from '../../shared/factory';
import { Attachment, CtorOption } from '../shared/entity';
import { RecordMap } from '../utils';

export enum ActorType {
	PLAYER = 'player',
	BOW = 'bow',
	ARROW = 'arrow',
}

export enum Direction {
	LEFT = 'left',
	RIGHT = 'right',
	FORWARD = 'forward',
	BACK = 'back',
}

export enum RunningState {
	SILENT = 'silent',
	WALKING = 'walking',
	RUNNING = 'running',
}

export enum AttachType {
	RIGHT_HAND = 'right_hand',
}

export interface AttachMappingUnit {
	[Direction.BACK]: [number, number];
	[Direction.FORWARD]: [number, number];
	[Direction.LEFT]: [number, number];
	[Direction.RIGHT]: [number, number];
	[key: string]: [number, number];
}

export interface AttachMapping {
	[AttachType.RIGHT_HAND]: AttachMappingUnit;
	[key: string]: AttachMappingUnit;
}

export class Actor extends Entity {
	@CtorOption()
	posX = 0;

	@CtorOption()
	posY = 0;

	@CtorOption()
	atLandX = 0;

	@CtorOption()
	atLandY = 0;

	@CtorOption()
	motionX = 0;

	@CtorOption()
	motionY = 0;

	@CtorOption()
	isUsing = false;

	@CtorOption()
	useTick = 0;

	@CtorOption()
	attachments: RecordMap<Attachment> = new RecordMap();

	@CtorOption()
	attaching: Attachment;

	type: ActorType;

	@CtorOption()
	attachMapping: AttachMapping;

	isMoveDirty = false;
	isWalkDirty = false;

	isActor = true;

	direction: Direction = Direction.FORWARD;
	running: RunningState = RunningState.SILENT;
}

@injectable()
export class ActorFactory extends Factory<string, Actor, any[]> {}

import { HashedStore } from '../../shared/store';
import { LandObject } from '../object/land';
import { inject, injectable } from 'inversify';

import * as PIXI from 'pixi.js';
import { Entity, MemoryDatabase } from '../../database/memory';
import { EventEmitter } from '../../server/shared/event';
import { ActorObject } from '../object/actor';
import { ContainerType } from '../../server/inventory';
import { ItemType } from '../../server/item';

@injectable()
export class ActorContainer extends PIXI.Container {}

@injectable()
export class LandContainer extends PIXI.Container {}

@injectable()
export class ActorStore extends HashedStore<ActorObject> {
	constructor(@inject(ActorContainer) actorContainer: ActorContainer) {
		super(actorContainer);
	}
	hash(item: ActorObject) {
		return [item.getServerId()];
	}
}

@injectable()
export class LandStore extends HashedStore<LandObject> {
	constructor(@inject(LandContainer) landContainer: LandContainer) {
		super(landContainer);
	}
	hash(item: LandObject) {
		return [[item.getServerId()], [item.x, item.y]];
	}
}

@injectable()
export class DataStore extends MemoryDatabase {}

@injectable()
export class UIEventBus extends EventEmitter {}

export class PlayerInfo extends Entity {
	/**
	 * 玩家名
	 */
	playerName: string;

	/**
	 * 玩家角色id
	 */
	actorId: number;
}

export class ShortcutContainerInfo extends Entity {
	/**
	 * 已经更新过至少一次
	 */
	firstUpdated = false;
	/**
	 * 快捷栏的容器id
	 */
	containerId: number;

	/**
	 * 当前背包指向的格子坐标
	 */
	currentIndexAt = 0;
}

/**
 * 背包中的一个格子
 */
export class InventoryBlockInfo extends Entity {
	/**
	 * 来自于容器
	 */
	containerType: ContainerType;

	/**
	 * 格子在背包中的坐标
	 */
	index: number;

	/**
	 * 物品类型
	 */
	itemType: ItemType;

	/**
	 * 物品存储数量
	 */
	itemCount = 0;
}

export class BowUsingInfo extends Entity {
	isUsing = false;
	/**
	 * 力度, 从 0 到 1
	 */
	power = 0;

	/**
	 * 弓是否已经可以释放了
	 */
	canRelease = false;
}

export const DataStoreEntities = [PlayerInfo, ShortcutContainerInfo, InventoryBlockInfo, BowUsingInfo];

import { inject, injectable } from 'inversify';
import { ICollection, injectCollection } from '../../shared/database/memory';
import { ContainerUpdateData, ContainerUpdateDataUnit, BLOCKS_PER_PLAYER_SHORTCUT_CONTAINER, ContainerType } from '../../server/inventory';
import { HTMLInputProvider, InputKey } from '../input';
import { GameManager } from '../shared/manager';
import { ShortcutContainerInfo, InventoryBlockInfo } from '../shared/store';
import { ItemType } from '../../server/item';
import { GameEvent } from '../event';

@injectable()
export class ShortcutManager extends GameManager {
	private shortcut: ShortcutContainerInfo;
	constructor(
		@inject(HTMLInputProvider) private input: HTMLInputProvider,
		@injectCollection(ShortcutContainerInfo) private shortcutStore: ICollection<ShortcutContainerInfo>,
		@injectCollection(InventoryBlockInfo) private blocksList: ICollection<InventoryBlockInfo>,
	) {
		super();

		this.shortcut = new ShortcutContainerInfo();
		this.shortcutStore.insertOne(this.shortcut);

		this.initBlocks();
	}

	private initBlocks() {
		const blocks: InventoryBlockInfo[] = [];
		for (let i = 0; i < BLOCKS_PER_PLAYER_SHORTCUT_CONTAINER; i++) {
			const block = new InventoryBlockInfo();
			block.containerType = ContainerType.SHORTCUT_CONTAINER;
			block.itemType = ItemType.EMPTY;
			block.index = i;
			blocks.push(block);
		}
		this.blocksList.insert(blocks);
	}

	/**
	 * 获取快捷栏当前选中的格子
	 */
	getCurrent() {
		return this.blocksList.findOne({ containerType: ContainerType.SHORTCUT_CONTAINER, index: this.shortcut.currentIndexAt });
	}

	/**
	 * 设置单个格子的数据
	 */
	updateBlock(updateDataUnit: ContainerUpdateDataUnit) {
		const found = this.blocksList.findOne({ index: updateDataUnit.index });
		if (!found) return;
		found.itemType = updateDataUnit.itemType;
		found.itemCount = updateDataUnit.count;

		this.blocksList.update(found);
	}

	/**
	 * 批量设置全部格子的数据
	 */
	updateBlocks(containerId: number, updateData: ContainerUpdateData) {
		this.shortcut.containerId = containerId;
		this.shortcut.firstUpdated = true;

		this.blocksList.removeWhere({ containerType: ContainerType.SHORTCUT_CONTAINER });
		const blocks: InventoryBlockInfo[] = [];
		for (const unit of updateData.units) {
			const block = new InventoryBlockInfo();
			block.containerType = ContainerType.SHORTCUT_CONTAINER;
			block.itemType = unit.itemType;
			block.index = unit.index;
			block.itemCount = unit.count;

			blocks[unit.index] = block;
		}

		this.shortcutStore.update(this.shortcut);
		this.blocksList.insert(blocks);
	}

	setCurrentIndex(indexAt: number, dirty = true) {
		if (!this.shortcut.firstUpdated) return;

		this.shortcut.currentIndexAt = indexAt;
		this.shortcutStore.update(this.shortcut);

		if (dirty) {
			this.emit(GameEvent.SetShortcutIndexEvent, indexAt, this.shortcut.containerId);
		}
	}

	private updateShortcutIndex() {
		if (this.input.keyDown(InputKey.NUM_1)) {
			this.setCurrentIndex(0);
		} else if (this.input.keyDown(InputKey.NUM_2)) {
			this.setCurrentIndex(1);
		} else if (this.input.keyDown(InputKey.NUM_3)) {
			this.setCurrentIndex(2);
		} else if (this.input.keyDown(InputKey.NUM_4)) {
			this.setCurrentIndex(3);
		} else if (this.input.keyDown(InputKey.NUM_5)) {
			this.setCurrentIndex(4);
		}
	}
	async doTick(tick: number) {
		this.updateShortcutIndex();
	}
}

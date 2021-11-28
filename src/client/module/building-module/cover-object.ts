import { CompositeRectTileLayer } from '@pixi/tilemap';
import * as PIXI from 'pixi.js';

import { GameObject } from '../../../framework/client-side/game-object';
import { TextureProvider } from '../../../framework/client-side/texture';
import { Range2 } from '../../../server/shared/range';
import { BRICK_WIDTH } from '../land-module/brick-object';

export class CoverObject extends GameObject {
	private coverLayer: CompositeRectTileLayer;
	private _coverRange: Range2;

	constructor(textureProvider: TextureProvider) {
		super(textureProvider);
		this.coverLayer = new CompositeRectTileLayer();
		this.coverLayer.scale.set(1 / BRICK_WIDTH, 1 / BRICK_WIDTH);
		this.addChild(this.coverLayer);
	}

	set coverRange(range: Range2) {
		this._coverRange = range;
		const texture = this.textureProvider.getOne('building.cover');
		this.coverLayer.clear();
		for (let x = range.from.x; x <= range.to.x; x++) {
			for (let y = range.from.y; y <= range.to.y; y++) {
				this.coverLayer.addFrame(texture, x * BRICK_WIDTH, y * BRICK_WIDTH);
			}
		}
	}
}

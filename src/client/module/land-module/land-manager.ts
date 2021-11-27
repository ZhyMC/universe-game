import { inject, injectable } from 'inversify';
import { LandLocToLoc, PosToLandPos } from '../../../server/module/land-module/helper';
import { Vector2 } from '../../../server/shared/math';
import { GameObjectManager } from '../../../framework/client-side/client-manager';
import { LandObject } from './land-object';
import { LandLayer } from '../../store';

@injectable()
export class LandManager extends GameObjectManager<LandObject> {
	constructor(@inject(LandLayer) private landLayer: LandLayer) {
		super(landLayer);
	}

	getLandByLoc(landLoc: Vector2) {
		return this.landLayer.get(landLoc.x, landLoc.y);
	}

	getBrickByLoc(pos: Vector2) {
		const landLoc = PosToLandPos(pos);
		const startAt = LandLocToLoc(landLoc);

		const land = this.getLandByLoc(landLoc);
		if (!land) return;

		const rawOffLoc = pos.sub(startAt);
		const offLoc = new Vector2(Math.floor(rawOffLoc.x), Math.floor(rawOffLoc.y));
		const brick = land.getBrickByOffset(offLoc);

		return brick;
	}
}

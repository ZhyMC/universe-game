import { Player } from './player-entity';
import { Actor } from '../actor-module/actor-entity';
import { GetRadiusLands } from '../land-module/land-entity';
import { inject, injectable } from 'inversify';
import { ActorManager } from '../actor-module/actor-manager';
import { Vector2 } from '../../shared/math';
import { GetArrayDiff } from '../../utils';
import { GetPosByHash, GetPosHash } from '../land-module/land-pos';
import { GetConstructOptions } from '../../shared/entity';

import * as Events from '../../event/internal';
import { LandManager } from '../land-module/land-manager';
import { AddEntityEvent, HandleInternalEvent, RemoveEntityEvent } from '@uni.js/event';
import { ExtendedEntityManager } from '@uni.js/server';

@injectable()
export class PlayerManager extends ExtendedEntityManager<Actor, Player> {
	constructor(@inject(ActorManager) private actorManager: ActorManager, @inject(LandManager) private landManager: LandManager) {
		super(actorManager, Player)
	}

	@HandleInternalEvent('actorManager', AddEntityEvent)
	private onActorAdded(event: AddEntityEvent) {
		for (const player of this.getAllEntities()) {
			this.spawnActor(player, event.entityId);
		}
	}

	@HandleInternalEvent('actorManager', RemoveEntityEvent)
	private onActorRemoved(event: RemoveEntityEvent) {
		for (const player of this.getAllEntities()) {
			this.despawnActor(player, event.entityId);
		}
	}

	@HandleInternalEvent('actorManager', Events.NewPosEvent)
	private onActorNewPos(event: Events.NewPosEvent) {
		const player = this.actorManager.getEntityById(event.actorId) as Player;
		if (!player.isPlayer) return;

		this.updateUsedLands(player);
	}

	isUseLand(player: Player, landPos: Vector2) {
		return player.usedLands.has(GetPosHash(landPos));
	}

	getCanSeeLands(player: Player) {
		return GetRadiusLands(new Vector2(player.posX, player.posY), 1);
	}

	isPlayerCansee(player: Player, landPos: Vector2) {
		const lands = this.getCanSeeLands(player);
		const result = lands.find((vec2) => {
			return vec2.equals(landPos);
		});
		return Boolean(result);
	}

	getAllEntities(): Readonly<Player>[] {
		return this.findEntities({ isPlayer: true });
	}

	addNewPlayer(connId: string) {
		const player = new Player();
		player.connId = connId;
		player.posX = 0;
		player.posY = 0;

		this.addNewEntity(player);
		this.updateUsedLands(player);

		return player;
	}

	spawnActor(player: Player, actorId: number) {
		if (player.spawnedActors.has(actorId)) return;

		const actor = this.actorManager.getEntityById(actorId);

		player.spawnedActors.add(actorId)
		const ctorOption = GetConstructOptions(actor);

		this.emitEvent(Events.SpawnActorEvent, { actorId, actorType: actor.type, fromPlayerId: player.id, ctorOption });
	}

	despawnActor(player: Player, actorId: number) {
		if (!player.spawnedActors.has(actorId)) return;

		player.spawnedActors.remove(actorId)
		this.emitEvent(Events.DespawnActorEvent, { actorId, fromPlayerId: player.id });
	}

	useLand(player: Player, landHash: string) {
		const landPos = GetPosByHash(landHash);

		player.usedLands.add(landHash)
		this.emitEvent(Events.LandUsedEvent, { playerId: player.id, landPosX: landPos.x, landPosY: landPos.y, landId: undefined });
	}

	unuseLand(player: Player, landHash: string) {
		const landPos = GetPosByHash(landHash);
		const land = this.landManager.getLand(landPos);

		player.usedLands.remove(landHash)
		this.emitEvent(Events.LandNeverUsedEvent, { playerId: player.id, landPosX: landPos.x, landPosY: landPos.y, landId: land.id });
	}

	private updateUsedLands(player: Player) {
		const landsPos = GetRadiusLands(new Vector2(player.posX, player.posY), 1).map(GetPosHash);

		const diff = GetArrayDiff(player.usedLands.getAll(), landsPos);

		for (const item of diff.add) {
			this.useLand(player, item);
		}
		for (const item of diff.remove) {
			this.unuseLand(player, item);
		}
	}

	doTick() {
		
	}
}

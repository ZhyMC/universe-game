import { BusEvent, EventBusServer, EventBusServerSymbol } from '../../framework/bus-server';
import { ServerSideController } from '../../framework/server-controller';
import { PlayerManager } from '../manager/player-manager';
import { inject, injectable } from 'inversify';

@injectable()
export class ConnectionController extends ServerSideController {
	constructor(@inject(EventBusServerSymbol) eventBus: EventBusServer, @inject(PlayerManager) private playerManager: PlayerManager) {
		super(eventBus);
		this.eventBus.on(BusEvent.ClientDisconnectEvent, this.onDisconnected.bind(this));
	}

	private onDisconnected(connId: string) {
		const player = this.playerManager.findEntity({ connId });
		if (!player) return;

		this.playerManager.removeEntity(player);
	}
}

import { inject, injectable } from 'inversify';
import { EventBusClient } from '../../framework/bus-client';
import { ContainerType } from '../../server/inventory';
import { ShortcutManager } from '../manager/shortcut-manager';
import { GameController } from '../../framework/client-controller';

import * as ServerEvents from '../../server/event/external';

import * as Events from '../event/internal';
import * as ExternalEvents from '../event/external';
import { HandleExternalEvent } from '../../framework/event';

@injectable()
export class ShortcutController extends GameController {
	constructor(@inject(EventBusClient) eventBus: EventBusClient, @inject(ShortcutManager) private shortcutManager: ShortcutManager) {
		super(eventBus);

		this.redirectToBusEvent(this.shortcutManager, Events.SetShortcutIndexEvent, ExternalEvents.SetShortcutIndexEvent);
	}

	@HandleExternalEvent(ServerEvents.UpdateContainerEvent)
	private handleUpdateContainer(event: ServerEvents.UpdateContainerEvent) {
		if (event.containerType == ContainerType.SHORTCUT_CONTAINER) {
			this.shortcutManager.updateBlocks(event.containerId, event.updateData, event.isFullUpdate);
		}
	}
}

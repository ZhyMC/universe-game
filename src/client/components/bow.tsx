import React from 'react';
import classNames from 'classnames';

import { useUIState } from '@uni.js/ui';
import { BowUsingState } from '../ui-states/bow';

import './bow.css';

export function BowUI() {
	const usingInfo = useUIState(BowUsingState);
	if (!usingInfo) return <></>;

	return (
		<div className="bow-ui" style={{ visibility: usingInfo.isUsing ? 'visible' : 'hidden' }}>
			<div className="bow-ui-power">
				<div
					className={classNames({
						'bow-ui-progress': true,
						'bow-ui-progress-release': usingInfo.canRelease,
						'bow-ui-progress-full': usingInfo.power === 1,
					})}
					style={{ width: `${usingInfo.power * 100}%` }}
				></div>
			</div>
		</div>
	);
}
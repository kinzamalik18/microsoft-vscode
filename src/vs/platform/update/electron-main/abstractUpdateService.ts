/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event, Emitter } from 'vs/base/common/event';
import { timeout } from 'vs/base/common/async';
import { IConfigurationService, getMigratedSettingValue } from 'vs/platform/configuration/common/configuration';
import { ILifecycleService } from 'vs/platform/lifecycle/electron-main/lifecycleMain';
import product from 'vs/platform/product/node/product';
import { IUpdateService, State, StateType, AvailableForDownload, UpdateType } from 'vs/platform/update/common/update';
import { IEnvironmentService } from 'vs/platform/environment/common/environment';
import { ILogService } from 'vs/platform/log/common/log';
import { IRequestService } from 'vs/platform/request/node/request';
import { CancellationToken } from 'vs/base/common/cancellation';

export function createUpdateURL(platform: string, quality: string): string {
	return `${product.updateUrl}/api/update/${platform}/${quality}/${product.commit}`;
}

export abstract class AbstractUpdateService implements IUpdateService {

	_serviceBrand: any;

	protected readonly url: string | undefined;

	private _state: State = State.Uninitialized;

	private _onStateChange = new Emitter<State>();
	get onStateChange(): Event<State> { return this._onStateChange.event; }

	get state(): State {
		return this._state;
	}

	protected setState(state: State): void {
		this.logService.info('update#setState', state.type);
		this._state = state;
		this._onStateChange.fire(state);
	}

	constructor(
		@ILifecycleService private readonly lifecycleService: ILifecycleService,
		@IConfigurationService protected configurationService: IConfigurationService,
		@IEnvironmentService private readonly environmentService: IEnvironmentService,
		@IRequestService protected requestService: IRequestService,
		@ILogService protected logService: ILogService,
	) {
		if (this.environmentService.disableUpdates) {
			this.logService.info('update#ctor - updates are disabled by the environment');
			return;
		}

		if (!product.updateUrl || !product.commit) {
			this.logService.info('update#ctor - updates are disabled as there is no update URL');
			return;
		}

		const updateMode = getMigratedSettingValue<string>(this.configurationService, 'update.mode', 'update.channel');
		const quality = this.getProductQuality(updateMode);

		if (!quality) {
			this.logService.info('update#ctor - updates are disabled by user preference');
			return;
		}

		this.url = this.buildUpdateFeedUrl(quality);
		if (!this.url) {
			this.logService.info('update#ctor - updates are disabled as the update URL is badly formed');
			return;
		}

		this.setState(State.Idle(this.getUpdateType()));

		if (updateMode === 'manual') {
			this.logService.info('update#ctor - manual checks only; automatic updates are disabled by user preference');
			return;
		}

		// Start checking for updates after 30 seconds
		this.scheduleCheckForUpdates(30 * 1000).then(undefined, err => this.logService.error(err));
	}

	private getProductQuality(updateMode: string): string | undefined {
		return updateMode === 'none' ? undefined : product.quality;
	}

	private scheduleCheckForUpdates(updateMode: string, delay = 60 * 60 * 1000): Promise<void> {
		return timeout(delay)
			.then(() => this.checkForUpdates(null))
			.then(() => {
				if (updateMode === 'start') {
					this.logService.info('update#ctor - startup checks only; automatic updates are disabled by user preference');
					return;
				} else {
					// Check again after 1 hour
					return this.scheduleCheckForUpdates(60 * 60 * 1000);
				}
			});
	}

	async checkForUpdates(context: any): Promise<void> {
		this.logService.trace('update#checkForUpdates, state = ', this.state.type);

		if (this.state.type !== StateType.Idle) {
			return;
		}

		this.doCheckForUpdates(context);
	}

	async downloadUpdate(): Promise<void> {
		this.logService.trace('update#downloadUpdate, state = ', this.state.type);

		if (this.state.type !== StateType.AvailableForDownload) {
			return;
		}

		await this.doDownloadUpdate(this.state);
	}

	protected async doDownloadUpdate(state: AvailableForDownload): Promise<void> {
		// noop
	}

	async applyUpdate(): Promise<void> {
		this.logService.trace('update#applyUpdate, state = ', this.state.type);

		if (this.state.type !== StateType.Downloaded) {
			return;
		}

		await this.doApplyUpdate();
	}

	protected async doApplyUpdate(): Promise<void> {
		// noop
	}

	quitAndInstall(): Promise<void> {
		this.logService.trace('update#quitAndInstall, state = ', this.state.type);

		if (this.state.type !== StateType.Ready) {
			return Promise.resolve(undefined);
		}

		this.logService.trace('update#quitAndInstall(): before lifecycle quit()');

		this.lifecycleService.quit(true /* from update */).then(vetod => {
			this.logService.trace(`update#quitAndInstall(): after lifecycle quit() with veto: ${vetod}`);
			if (vetod) {
				return;
			}

			this.logService.trace('update#quitAndInstall(): running raw#quitAndInstall()');
			this.doQuitAndInstall();
		});

		return Promise.resolve(undefined);
	}

	isLatestVersion(): Promise<boolean | undefined> {
		if (!this.url) {
			return Promise.resolve(undefined);
		}
		return this.requestService.request({ url: this.url }, CancellationToken.None).then(context => {
			// The update server replies with 204 (No Content) when no
			// update is available - that's all we want to know.
			if (context.res.statusCode === 204) {
				return true;
			} else {
				return false;
			}
		});
	}

	protected getUpdateType(): UpdateType {
		return UpdateType.Archive;
	}

	protected doQuitAndInstall(): void {
		// noop
	}

	protected abstract buildUpdateFeedUrl(quality: string): string | undefined;
	protected abstract doCheckForUpdates(context: any): void;
}

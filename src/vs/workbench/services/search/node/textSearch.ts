/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as strings from 'vs/base/common/strings';
import uri from 'vs/base/common/uri';

import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';

import * as ipc from 'vs/base/parts/ipc/common/ipc';
import * as baseMime from 'vs/base/common/mime';
import { TPromise } from 'vs/base/common/winjs.base';

import { ILineMatch, IProgress, IPatternInfo } from 'vs/platform/search/common/search';
import { FileWalker } from 'vs/workbench/services/search/node/fileSearch';
import { UTF16le, UTF16be, UTF8, UTF8_with_bom, encodingExists, decode } from 'vs/base/node/encoding';
import { ISerializedFileMatch, ISerializedSearchComplete, IRawSearch, ISearchEngine } from './search';
import { ISearchWorkerConfig, ISearchWorkerSearchArgs, ISearchWorker, ISearchWorkerChannel, SearchWorkerChannelClient } from './worker/searchWorkerIpc'

import { Client } from 'vs/base/parts/ipc/node/ipc.cp';

export class Engine implements ISearchEngine<ISerializedFileMatch> {

	private static PROGRESS_FLUSH_CHUNK_SIZE = 50; // optimization: number of files to process before emitting progress event

	private config: IRawSearch;
	private walker: FileWalker;
	private walkerError: Error;

	private isCanceled = false;
	private isDone = false;
	private totalBytes = 0;
	private processedBytes = 0;
	private progressed = 0;
	private walkerIsDone = false;
	private limitReached = false;
	private numResults = 0;
	private fileEncoding: string;

	private nextWorker = 0;
	private workers: ISearchWorker[] = [];
	private workerPromises: TPromise<void>[] = [];

	constructor(config: IRawSearch, walker: FileWalker) {
		this.config = config;
		this.walker = walker;
		this.fileEncoding = encodingExists(config.fileEncoding) ? config.fileEncoding : UTF8; // todo

		// Spin up workers
		const numWorkers = Math.ceil(os.cpus().length/2); // /2 because of hyperthreading. Maybe make better.
		for (let i = 0; i < numWorkers; i++) {
			const worker = createWorker(i, config.contentPattern);
			this.workers.push(worker);
		}
	}

	public cancel(): void {
		this.isCanceled = true;
		this.walker.cancel();

		// TODO cancel workers
	}

	public search(onResult: (match: ISerializedFileMatch) => void, onProgress: (progress: IProgress) => void, done: (error: Error, complete: ISerializedSearchComplete) => void): void {
		let resultCounter = 0;

		const progress = () => {
			if (++this.progressed % Engine.PROGRESS_FLUSH_CHUNK_SIZE === 0) {
				onProgress({ total: this.totalBytes, worked: this.processedBytes }); // buffer progress in chunks to reduce pressure
			}
		};

		const unwind = (processed: number) => {
			this.processedBytes += processed;

			// Emit progress() unless we got canceled or hit the limit
			if (processed && !this.isDone && !this.isCanceled && !this.limitReached) {
				progress();
			}

			// Emit done()
			console.log('unwind: ' + this.worked + '/' + this.total);
			if (!this.isDone && this.processedBytes === this.totalBytes && this.walkerIsDone) {
				this.isDone = true;
				done(this.walkerError, {
					limitHit: this.limitReached,
					stats: this.walker.getStats()
				});
			}
		};

		let begin = 0;
		const run = (batch: string[], batchBytes: number): TPromise<void> => {
			console.log(`onBatchReady: ${batchBytes}, ${this.processedBytes}/${this.totalBytes}`);
			const worker = this.workers[this.nextWorker];
			this.nextWorker = (this.nextWorker + 1) % this.workers.length;

			const batchPromise = worker.search({absolutePaths: batch, maxResults: 1e8 }).then(matches => {
				console.log('got result - ' + batchBytes);
				this.numResults += matches.length;
				matches.forEach(m => {
					if (m && m.lineMatches.length) {
						onResult(m);
					}
				});

				unwind(batchBytes);
			});

			this.workerPromises.push(batchPromise);
			return batchPromise;
		}

		// Walk over the file system
		const files = [];
		let nextBatch = [];
		let nextBatchBytes = 0;
		let batchFlushBytes = 5e6;
		this.walker.walk(this.config.rootFolders, this.config.extraFiles, result => {
			let bytes = result.size || 1;

			// If the result is empty or we have reached the limit or we are canceled, ignore it
			if (this.limitReached || this.isCanceled) {
				return unwind(bytes);
			}

			// Indicate progress to the outside
			progress();

			const absolutePath = result.base ? [result.base, result.relativePath].join(path.sep) : result.relativePath;
			nextBatch.push(absolutePath);
			nextBatchBytes += bytes;
			this.totalBytes += bytes;

			if (nextBatchBytes >= batchFlushBytes) {
				run(nextBatch, nextBatchBytes);
				nextBatch = [];
				nextBatchBytes = 0;
			}
		}, (error, isLimitHit) => {
			if (nextBatch.length) {
				run(nextBatch, nextBatchBytes);
			}

			this.walkerIsDone = true;
			this.walkerError = error;
		});
	}
}

function createWorker(id: number, pattern: IPatternInfo): ISearchWorker {
	let client = new Client(
		uri.parse(require.toUrl('bootstrap')).fsPath,
		{
			serverName: 'Search Worker ' + id,
			timeout: 60 * 60 * 1000,
			args: ['--type=searchWorker'],
			env: {
				AMD_ENTRYPOINT: 'vs/workbench/services/search/node/worker/searchWorkerApp',
				PIPE_LOGGING: 'true',
				VERBOSE_LOGGING: 'true'
			}
		});

	// Make async?
	const channel = ipc.getNextTickChannel(client.getChannel<ISearchWorkerChannel>('searchWorker'));
	const channelClient = new SearchWorkerChannelClient(channel);
	const config: ISearchWorkerConfig = { pattern, id }
	channelClient.initialize(config);
	return channelClient;
}
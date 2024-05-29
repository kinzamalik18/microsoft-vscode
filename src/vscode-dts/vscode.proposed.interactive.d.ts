/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'vscode' {

	export namespace interactive {
		// Can be deleted after another insiders
		export const _version: number;
		export function transferActiveChat(toWorkspace: Uri): void;
	}
}

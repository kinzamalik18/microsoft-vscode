/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { escape } from 'vs/base/common/strings';
import { localize } from 'vs/nls';

export default (): string => `
<div id="issue-reporter">
	<div id="english" class="input-group hidden">${escape(localize('completeInEnglish', "Please complete the form in English."))}</div>

	<div class="section">
		<div class="input-group">
			<label id="issue-type-label" class="inline-form-control" for="issue-type">${escape(localize('issueTypeLabel', "This is a"))}</label>
			<select id="issue-type" class="inline-form-control">
				<option value="0">${escape(localize('bugReporter', "Bug Report"))}</option>
				<option value="1">${escape(localize('performanceIssue', "Performance Issue"))}</option>
				<option value="2">${escape(localize('featureRequest', "Feature Request"))}</option>
			</select>
		</div>

		<div class="input-group">
			<label id="issue-title-label" for="issue-title">${escape(localize('issueTitleLabel', "Title"))} <span class="required-input">*</span></label>
			<input id="issue-title" type="text" class="inline-form-control" placeholder="${escape(localize('issueTitleRequired', "Please enter a title."))}" required>
			<small id="similar-issues">
				<!-- To be dynamically filled -->
			</small>
		</div>
	</div>

	<div class="system-info">
		<div id="block-container">
			<div class="block block-system">
				<details>
					<summary>${escape(localize('systemInfo', "My System Info"))}
						<input class="sendData" type="checkbox" id="includeSystemInfo" checked>
							<label class="caption" for="includeSystemInfo">${escape(localize('sendData', "Send my data"))}</label>
						</input>
					</summary>
					<div class="block-info">
						<!-- To be dynamically filled -->
					</div>
				</details>
			</div>
			<div class="block block-process">
				<details>
					<summary>${escape(localize('processes', "Currently Running Processes"))}
						<input class="sendData"  type="checkbox" id="includeProcessInfo" checked>
							<label class="caption" for="includeProcessInfo">${escape(localize('sendData', "Send my data"))}</label>
						</input>
					</summary>
					<div class="block-info">
						<!-- To be dynamically filled -->
					</div>
				</details>
			</div>
			<div class="block block-workspace">
				<details>
					<summary>${escape(localize('workspaceStats', "My Workspace Stats"))}
						<input class="sendData"  type="checkbox" id="includeWorkspaceInfo" checked>
							<label class="caption" for="includeWorkspaceInfo">${escape(localize('sendData', "Send my data"))}</label>
						</input>
					</summary>
					<pre class="block-info">
						<code>
							<!-- To be dynamically filled -->
						</code>
					</pre>
				</details>
			</div>
			<div class="block block-extensions">
				<details>
					<summary>${escape(localize('extensions', "My Extensions"))}
						<input class="sendData"  type="checkbox" id="includeExtensions" checked>
							<label class="caption" for="includeExtensions">${escape(localize('sendData', "Send my data"))}</label>
						</input>
					</summary>
					<div class="block-info">
						<!-- To be dynamically filled -->
					</div>
				</details>
			</div>
		</div>
	</div>

	<div class="section">
		<div id="disabledExtensions">
			<div class="extensions-form">
				<label>${escape(localize('tryDisablingExtensions', "Is the problem reproducible when extensions are disabled?"))}</label>
				<div class="choice">
					<input type="radio" id="reproducesWithoutExtensions" value=true name="reprosWithoutExtensions" />
					<label for="reproducesWithoutExtensions">${escape(localize('yes', "Yes"))}</label>
				</div>
				<div class="choice">
					<input type="radio" id="reproducesWithExtensions" value=false name="reprosWithoutExtensions" checked/>
					<label for="reproducesWithExtensions">${escape(localize('no', "No"))}</label>
				</div>
			</div>
			<div class="instructions">${escape(localize('disableExtensionsLabel', "Try to reproduce the problem after "))}<button id="disableExtensions" class="workbenchCommand">${escape(localize('disableExtensions', "disabling all extensions and reloading the window"))}</button>.</div>
			<div class="instructions">${escape(localize('showRunningExtensionsLabel', "If you suspect it's an extension issue, "))}<button id="showRunning" class="workbenchCommand">${escape(localize('showRunningExtensions', "see all running extensions"))}</button>.</div>
		</div>
	</div>

	<div class="input-group">
		<label for="description" id="issue-description-label">
			<!-- To be dynamically filled -->
		</label>
		<div class="instructions" id="issue-description-subtitle">
			<!-- To be dynamically filled -->
		</div>
		<div class="block-info-text">
			<textarea name="description" id="description" cols="100" rows="12" placeholder="${escape(localize('details', "Please enter details."))}" required></textarea>
		</div>
	</div>

	<div id="url-length-validation-error" class="validation-error hidden" role="alert">
		<-- To be dynamically filled -->
	</div>
	<button id="github-submit-btn" disabled>${escape(localize('loadingData', "Loading data..."))}</button>
</div>`;
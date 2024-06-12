/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Disposable } from 'vs/base/common/lifecycle';
import { localize } from 'vs/nls';
import { ICommandService } from 'vs/platform/commands/common/commands';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { IDialogService } from 'vs/platform/dialogs/common/dialogs';
import { IStorageService, StorageScope } from 'vs/platform/storage/common/storage';
import { IChatCommandExecutionService } from 'vs/workbench/contrib/chat/browser/chat';
import { IChatResponseViewModel } from 'vs/workbench/contrib/chat/common/chatViewModel';

const GRANTED_RUN_COMMAND_PERMISSION_KEY = 'chat.grantedRunCommandPermission';

export class ChatCommandExecutionService extends Disposable implements IChatCommandExecutionService {
	declare readonly _serviceBrand: undefined;
	constructor(
		@ICommandService private readonly _commandService: ICommandService,
		@IConfigurationService private readonly _configurationService: IConfigurationService,
		@IStorageService private readonly _storageService: IStorageService,
		@IDialogService private readonly _dialogService: IDialogService
	) {
		super();
	}
	async acceptResponse(response: IChatResponseViewModel | string | undefined): Promise<void> {
		if (!this._configurationService.getValue('github.copilot.experimental.runBestCommandMatch')) {
			return;
		}

		if (!response || typeof response === 'string' || response.agent?.id !== 'vscode') {
			return;
		}

		const responseValues = response.response.value;
		const commandResponse = responseValues.find(value => value.kind === 'command');
		if (!commandResponse || !commandsToRun.has(commandResponse.command.id)) {
			return;
		}
		const grantedPermission = this._storageService.getBoolean(GRANTED_RUN_COMMAND_PERMISSION_KEY, StorageScope.WORKSPACE, false);
		if (!grantedPermission) {
			const message = localize('confirmAutomaticRunChatResponseCommand', "Would you like to automatically run the best matching command in the chat response?");
			const detail = localize('runChatResponseAction', "Yes, run: {0}", commandResponse.command.title);
			const confirmation = await this._dialogService.confirm({
				message,
				detail,
				checkbox: {
					label: localize('doNotAskAgain', "Do not ask me again")
				},
				primaryButton: localize({ key: 'runLabel', comment: ['Indicates action'] }, "{0}", commandResponse.command.title),
			});

			if (!confirmation.confirmed) {
				return;
			}

			// Check for confirmation checkbox
			if (confirmation.checkboxChecked === true) {
				this._configurationService.updateValue('github.copilot.experimental.runBestCommandMatch', false);
			}
		}

		this._commandService.executeCommand(commandResponse.command.id, commandResponse.command.arguments);
	}
}

const commandsToRun = new Set([
	'cursorUndo',
	'cursorRedo',
	'editor.action.forceRetokenize',
	'editor.action.toggleWordWrap',
	'editor.action.moveCarretLeftAction',
	'editor.action.moveCarretRightAction',
	'editor.action.fontZoomIn',
	'editor.action.fontZoomOut',
	'editor.action.fontZoomReset',
	'editor.action.smartSelect.expand',
	'editor.action.smartSelect.shrink',
	'editor.emmet.action.expandAbbreviation',
	'editor.action.setSelectionAnchor',
	'editor.action.inspectTMScopes',
	'editor.action.commentLine',
	'editor.action.addCommentLine',
	'editor.action.removeCommentLine',
	'editor.action.blockComment',
	'editor.action.transposeLetters',
	'editor.action.indentationToSpaces',
	'editor.action.indentationToTabs',
	'editor.action.indentUsingTabs',
	'editor.action.indentUsingSpaces',
	'editor.action.changeTabDisplaySize',
	'editor.action.detectIndentation',
	'editor.action.reindentlines',
	'editor.action.reindentselectedlines',
	'deleteInsideWord',
	'editor.action.copyLinesUpAction',
	'editor.action.copyLinesDownAction',
	'editor.action.duplicateSelection',
	'editor.action.moveLinesUpAction',
	'editor.action.moveLinesDownAction',
	'editor.action.sortLinesAscending',
	'editor.action.sortLinesDescending',
	'editor.action.removeDuplicateLines',
	'editor.action.trimTrailingWhitespace',
	'editor.action.deleteLines',
	'editor.action.indentLines',
	'editor.action.outdentLines',
	'editor.action.insertLineBefore',
	'editor.action.insertLineAfter',
	'deleteAllLeft',
	'deleteAllRight',
	'editor.action.joinLines',
	'editor.action.transpose',
	'editor.action.transformToUppercase',
	'editor.action.transformToLowercase',
	'editor.action.transformToSnakecase',
	'editor.action.transformToCamelcase',
	'editor.action.transformToPascalcase',
	'editor.action.transformToTitlecase',
	'editor.action.transformToKebabcase',
	'expandLineSelection',
	'editor.action.formatDocument',
	'editor.action.formatSelection',
	'editor.action.showContextMenu',
	'editor.action.inlineEdit.trigger',
	'editor.debug.action.conditionalBreakpoint',
	'editor.debug.action.addLogPoint',
	'editor.debug.action.triggerByBreakpoint',
	'editor.debug.action.editBreakpoint',
	'editor.debug.action.goToNextBreakpoint',
	'editor.debug.action.goToPreviousBreakpoint',
	'editor.action.selectToBracket',
	'editor.action.jumpToBracket',
	'editor.action.removeBrackets',
	'editor.action.clipboardCopyWithSyntaxHighlightingAction',
	'editor.action.pasteAs',
	'editor.action.pasteAsText',
	'editor.action.inPlaceReplace.up',
	'editor.action.inPlaceReplace.down',
	'editor.action.openLink',
	'editor.action.unicodeHighlight.disableHighlightingOfAmbiguousCharacters',
	'editor.action.unicodeHighlight.disableHighlightingOfInvisibleCharacters',
	'editor.action.unicodeHighlight.disableHighlightingOfNonBasicAsciiCharacters',
	'editor.action.unicodeHighlight.showExcludeOptions',
	'editor.action.quickFix',
	'editor.action.refactor',
	'editor.action.sourceAction',
	'codelens.showLensesInCurrentLine',
	'editor.unfold',
	'editor.unfoldRecursively',
	'editor.fold',
	'editor.foldRecursively',
	'editor.foldAll',
	'editor.unfoldAll',
	'editor.foldAllBlockComments',
	'editor.foldAllMarkerRegions',
	'editor.unfoldAllMarkerRegions',
	'editor.foldAllExcept',
	'editor.unfoldAllExcept',
	'editor.toggleFold',
	'editor.gotoParentFold',
	'editor.gotoPreviousFold',
	'editor.gotoNextFold',
	'editor.createFoldingRangeFromSelection',
	'editor.removeManualFoldingRanges',
	'editor.foldLevel1',
	'editor.foldLevel2',
	'editor.foldLevel3',
	'editor.foldLevel4',
	'editor.foldLevel5',
	'editor.foldLevel6',
	'editor.foldLevel7',
	'editor.action.wordHighlight.trigger',
	'actions.find',
	'editor.action.startFindReplaceAction',
	'editor.actions.findWithArgs',
	'actions.findWithSelection',
	'editor.action.nextMatchFindAction',
	'editor.action.previousMatchFindAction',
	'editor.action.nextSelectionMatchFindAction',
	'editor.action.previousSelectionMatchFindAction',
	'editor.action.insertCursorAbove',
	'editor.action.insertCursorBelow',
	'editor.action.insertCursorAtEndOfEachLineSelected',
	'editor.action.addSelectionToNextFindMatch',
	'editor.action.addSelectionToPreviousFindMatch',
	'editor.action.moveSelectionToNextFindMatch',
	'editor.action.moveSelectionToPreviousFindMatch',
	'editor.action.selectHighlights',
	'editor.action.addCursorsToBottom',
	'editor.action.addCursorsToTop',
	'editor.action.focusNextCursor',
	'editor.action.focusPreviousCursor',
	'editor.action.marker.next',
	'editor.action.marker.prev',
	'editor.action.marker.nextInFiles',
	'editor.action.marker.prevInFiles',
	'editor.action.triggerSuggest',
	'editor.action.resetSuggestSize',
	'editor.action.dirtydiff.previous',
	'editor.action.dirtydiff.next',
	'workbench.action.editor.previousChange',
	'workbench.action.editor.nextChange',
	'editor.action.formatChanges',
	'editor.action.showHover',
	'editor.action.showDefinitionPreviewHover',
	'editor.action.inlineSuggest.trigger',
	'editor.debug.action.selectionToWatch',
	'workbench.action.debug.nextConsole',
	'workbench.debug.action.focusRepl',
	'workbench.action.debug.prevConsole',
	'editor.debug.action.toggleInlineBreakpoint',
	'workbench.action.debug.restart',
	'editor.debug.action.runToCursor',
	'workbench.action.debug.selectDebugConsole',
	'workbench.action.showAboutDialog',
	'workbench.action.editor.changeEOL',
	'workbench.action.editor.changeEncoding',
	'workbench.action.clearEditorHistory',
	'notebook.clearNotebookEdtitorTypeCache',
	'notebook.clearNotebookKernelsMRUCache',
	'workbench.action.clearRecentFiles',
	'workbench.action.closeAllGroups',
	'workbench.action.closeAllEditors',
	'workbench.action.closeEditorsInGroup',
	'workbench.action.closeActiveEditor',
	'workbench.action.closeEditorInAllGroups',
	'workbench.action.closeEditorsInOtherGroups',
	'workbench.action.closeEditorsToTheLeft',
	'workbench.action.closeOtherEditors',
	'workbench.action.closeActivePinnedEditor',
	'workbench.action.closeSidebar',
	'workbench.action.closeUnmodifiedEditors',
	'workbench.files.action.compareWithClipboard',
	'workbench.files.action.compareWithSaved',
	'workbench.files.action.compareNewUntitledTextFiles',
	'workbench.action.tasks.configureDefaultBuildTask',
	'workbench.action.tasks.configureTaskRunner',
	'testing.configureProfile',
	'workbench.action.pauseSocketWriting',
	'workbench.action.triggerReconnect',
	'workbench.action.copyEditorGroupToNewWindow',
	'copyFilePath',
	'copyRelativeFilePath',
	'workbench.action.customizeLayout',
	'workbench.notebook.layout.configure',
	'workbench.action.duplicateActiveEditorGroupDown',
	'workbench.action.duplicateActiveEditorGroupLeft',
	'workbench.action.duplicateActiveEditorGroupRight',
	'workbench.action.duplicateActiveEditorGroupUp',
	'workbench.action.focusActiveEditorGroup',
	'workbench.action.focusAboveGroup',
	'workbench.action.focusBelowGroup',
	'workbench.action.focusFirstEditorGroup',
	'workbench.action.focusPanel',
	'workbench.action.focusSideBar',
	'workbench.action.focusAuxiliaryBar',
	'workbench.action.focusLastEditorGroup',
	'workbench.action.focusLeftGroup',
	'workbench.action.focusNextGroup',
	'workbench.action.focusNextPart',
	'workbench.files.action.focusFilesExplorer',
	'workbench.action.focusPreviousGroup',
	'workbench.action.focusPreviousPart',
	'workbench.action.focusRightGroup',
	'workbench.action.focusStatusBar',
	'workbench.action.navigateBackInEditLocations',
	'workbench.action.navigateBackInNavigationLocations',
	'workbench.action.navigateForwardInEditLocations',
	'workbench.action.navigateForwardInNavigationLocations',
	'workbench.action.navigateLast',
	'workbench.action.navigatePreviousInEditLocations',
	'workbench.action.navigatePreviousInNavigationLocations',
	'workbench.action.quickOpen',
	'workbench.action.navigateToLastEditLocation',
	'workbench.action.navigateToLastNavigationLocation',
	'workbench.action.gotoLine',
	'workbench.action.compareEditor.nextChange',
	'testing.goToNextMessage',
	'workbench.action.compareEditor.previousChange',
	'testing.goToPreviousMessage',
	'workbench.action.gotoSymbol',
	'workbench.action.showAllSymbols',
	'workbench.action.editorLayoutTwoByTwoGrid',
	'workbench.action.closePanel',
	'workbench.action.inspectContextKeys',
	'workbench.action.inspectKeyMappings',
	'workbench.action.inspectKeyMappingsJSON',
	'notebook.inspectLayout',
	'workbench.action.joinAllGroups',
	'workbench.action.joinTwoGroups',
	'workbench.action.keepEditor',
	'merge.dev.loadContentsFromFolder',
	'workbench.action.logStorage',
	'workbench.action.logWorkingCopies',
	'workbench.action.moveActiveEditorGroupDown',
	'workbench.action.moveEditorGroupToNewWindow',
	'workbench.action.moveActiveEditorGroupLeft',
	'workbench.action.moveActiveEditorGroupRight',
	'workbench.action.moveActiveEditorGroupUp',
	'workbench.action.moveEditorToFirstGroup',
	'workbench.action.moveEditorToAboveGroup',
	'workbench.action.moveEditorToBelowGroup',
	'workbench.action.moveEditorToLastGroup',
	'workbench.action.moveEditorToLeftGroup',
	'workbench.action.moveEditorToNextGroup',
	'workbench.action.moveEditorToPreviousGroup',
	'workbench.action.moveEditorToRightGroup',
	'workbench.action.moveEditorLeftInGroup',
	'workbench.action.moveEditorRightInGroup',
	'workbench.action.positionPanelLeft',
	'workbench.action.positionPanelRight',
	'workbench.action.positionPanelBottom',
	'workbench.action.movePanelToSecondarySideBar',
	'workbench.action.moveSecondarySideBarToPanel',
	'workbench.action.moveView',
	'workbench.action.navigateEditorGroups',
	'workbench.action.quickOpenNavigateNext',
	'workbench.action.quickOpenNavigatePrevious',
	'workbench.action.navigateUp',
	'workbench.action.navigateDown',
	'workbench.action.navigateLeft',
	'workbench.action.navigateRight',
	'workbench.action.newGroupAbove',
	'workbench.action.newGroupBelow',
	'workbench.action.newGroupLeft',
	'workbench.action.newGroupRight',
	'workbench.action.newEmptyEditorWindow',
	'welcome.showNewFileEntries',
	'explorer.newFile',
	'explorer.newFolder',
	'workbench.action.files.newUntitledFile',
	'workbench.action.newWindow',
	'workbench.action.nextPanelView',
	'workbench.action.openExtensionLogsFolder',
	'workbench.action.files.openFile',
	'workbench.action.firstEditorInGroup',
	'workbench.action.lastEditorInGroup',
	'workbench.action.openLogsFolder',
	'merge.dev.openContentsJson',
	'workbench.action.nextEditor',
	'workbench.action.nextEditorInGroup',
	'workbench.action.openNextRecentlyUsedEditor',
	'workbench.action.openNextRecentlyUsedEditorInGroup',
	'workbench.action.previousEditor',
	'workbench.action.previousEditorInGroup',
	'workbench.action.openPreviousRecentlyUsedEditor',
	'workbench.action.openPreviousRecentlyUsedEditorInGroup',
	'workbench.action.openProcessExplorer',
	'workbench.action.openRecent',
	'merge.dev.openSelectionInTemporaryMergeEditor',
	'workbench.action.pinEditor',
	'workbench.action.previousPanelView',
	'workbench.action.quickOpenLeastRecentlyUsedEditor',
	'workbench.action.openPreviousEditorFromHistory',
	'workbench.action.quickOpenPreviousRecentlyUsedEditor',
	'workbench.action.webview.reloadWebviewAction',
	'workbench.action.reloadWindow',
	'workbench.action.removeLargeStorageDatabaseEntries',
	'workbench.action.reopenClosedEditor',
	'workbench.action.reopenWithEditor',
	'menu.resetHiddenStates',
	'mergeEditor.resetCloseWithConflictsChoice',
	'files.participants.resetChoice',
	'workbench.action.evenEditorWidths',
	'workbench.action.resetViewLocations',
	'workbench.files.action.showActiveFileInExplorer',
	'revealFileInOS',
	'workbench.action.revertAndCloseActiveEditor',
	'workbench.action.files.revert',
	'workbench.action.files.save',
	'workbench.action.files.saveAll',
	'workbench.action.files.saveFiles',
	'workbench.files.action.saveAllInGroup',
	'workbench.action.files.saveAs',
	'workbench.action.files.saveWithoutFormatting',
	'workbench.action.quickOpenSelectNext',
	'workbench.action.quickOpenSelectPrevious',
	'workbench.action.setLogLevel',
	'workbench.action.alignPanelCenter',
	'workbench.action.alignPanelJustify',
	'workbench.action.alignPanelLeft',
	'workbench.action.alignPanelRight',
	'workbench.action.showAllEditors',
	'workbench.action.showAllEditorsByMostRecentlyUsed',
	'workbench.action.showEditorsInActiveGroup',
	'workbench.action.tasks.showTasks',
	'workbench.action.tasks.showLog',
	'_workbench.output.showViewsLog',
	'workbench.action.editorLayoutSingle',
	'workbench.action.splitEditor',
	'workbench.action.splitEditorDown',
	'workbench.action.splitEditorToFirstGroup',
	'workbench.action.splitEditorToAboveGroup',
	'workbench.action.splitEditorToBelowGroup',
	'workbench.action.splitEditorToLastGroup',
	'workbench.action.splitEditorToLeftGroup',
	'workbench.action.splitEditorToNextGroup',
	'workbench.action.splitEditorToPreviousGroup',
	'workbench.action.splitEditorToRightGroup',
	'workbench.action.splitEditorLeft',
	'workbench.action.splitEditorOrthogonal',
	'workbench.action.splitEditorRight',
	'workbench.action.splitEditorUp',
	'editor.action.startDebugTextMate',
	'workbench.action.stopTracing',
	'workbench.action.tasks.terminate',
	'workbench.action.editorLayoutThreeColumns',
	'workbench.action.editorLayoutThreeRows',
	'workbench.action.toggleAutoSave',
	'editor.action.toggleRenderControlCharacter',
	'workbench.action.toggleEditorGroupLock',
	'workbench.action.toggleEditorWidths',
	'workbench.action.toggleKeybindingsLog',
	'notebook.toggleLayoutTroubleshoot',
	'editor.action.toggleMinimap',
	'workbench.action.toggleMultiCursorModifier',
	'notebook.action.toggleNotebookStickyScroll',
	'workbench.action.toggleSidebarPosition',
	'workbench.action.toggleSidebarVisibility',
	'editor.action.toggleRenderWhitespace',
	'editor.action.toggleScreenReaderAccessibilityMode',
	'workbench.action.toggleScreencastMode',
	'workbench.action.toggleAuxiliaryBar',
	'workbench.action.toggleStatusbarVisibility',
	'editor.action.toggleTabFocusMode',
	'testing.toggleTestingPeekHistory',
	'workbench.action.toggleEditorGroupLayout',
	'redo',
	'editor.action.selectAll',
	'undo',
	'debug.addConfiguration',
	'workbench.debug.viewlet.action.addDataBreakpointOnAddress',
	'workbench.debug.viewlet.action.addFunctionBreakpointAction',
	'workbench.action.browseColorThemesInMarketplace',
	'workbench.action.closeWindow',
	'workbench.action.selectTheme',
	'workbench.action.tasks.configureDefaultTestTask',
	'workbench.action.configureRuntimeArguments',
	'remote.tunnel.copyAddressCommandPalette',
	'workbench.action.selectIconTheme',
	'workbench.action.focusActivityBar',
	'workbench.action.focusBanner',
	'workbench.action.generateColorTheme',
	'workbench.action.activityBarLocation.hide',
	'editor.action.measureExtHostLatency',
	'workbench.action.activityBarLocation.bottom',
	'workbench.action.activityBarLocation.top',
	'workbench.action.nextSideBarView',
	'workbench.action.tasks.openUserTasks',
	'welcome.showAllWalkthroughs',
	'workbench.action.previousSideBarView',
	'workbench.action.selectProductIconTheme',
	'workbench.action.reloadWindowWithExtensionsDisabled',
	'workbench.debug.viewlet.action.removeAllBreakpoints',
	'editor.inlayHints.Reset',
	'resetGettingStartedProgress',
	'workbench.action.zoomReset',
	'workbench.action.restartExtensionHost',
	'remote.tunnel.closeCommandPalette',
	'workbench.action.switchWindow',
	'workbench.debug.viewlet.action.toggleBreakpointsActivatedAction',
	'workbench.action.toggleLightDarkThemes',
	'breadcrumbs.toggle',
	'editor.action.toggleColumnSelection',
	'workbench.action.toggleDevTools',
	'debug.action.toggleDisassemblyViewSourceCode',
	'tree.toggleStickyScroll',
	'workbench.action.uninstallCommandLine',
	'workbench.action.openWalkthrough',
	'workbench.action.zoomIn',
	'editor.action.clipboardCopyAction',
	'editor.action.clipboardCutAction',
	'editor.action.clipboardPasteAction',
	'notification.acceptPrimaryAction',
	'_workbench.extensions.action.cleanUpExtensionsFolder',
	'notifications.clearAll',
	'workbench.action.clearCommandHistory',
	'workbench.action.configureLanguageBasedSettings',
	'workbench.extensions.action.configureWorkspaceFolderRecommendedExtensions',
	'workbench.extensions.action.disableAll',
	'workbench.extensions.action.disableAllWorkspace',
	'notifications.focusToasts',
	'workbench.debug.action.focusBreakpointsView',
	'workbench.debug.action.focusCallStackView',
	'workbench.panel.repl.view.focus',
	'workbench.views.extensions.disabled.focus',
	'workbench.views.extensions.enabled.focus',
	'workbench.extensions.action.focusExtensionsView',
	'workbench.explorer.fileView.focus',
	'workbench.views.extensions.installed.focus',
	'workbench.files.action.focusOpenEditorsView',
	'outline.focus',
	'workbench.panel.output.focus',
	'workbench.panel.markers.view.focus',
	'workbench.view.search.focus',
	'workbench.scm.repositories.focus',
	'workbench.scm.focus',
	'terminal.focus',
	'timeline.focus',
	'workbench.debug.action.focusVariablesView',
	'workbench.debug.action.focusWatchView',
	'workbench.action.focusTitleBar',
	'workbench.action.openAccessibilitySettings',
	'workbench.action.openDefaultKeybindingsFile',
	'workbench.action.openRawDefaultSettings',
	'workbench.extensions.action.openExtensionsFolder',
	'workbench.action.openGlobalKeybindings',
	'workbench.action.openGlobalKeybindingsFile',
	'workbench.action.openQuickChat',
	'search.action.openInEditor',
	'workbench.action.openSettings2',
	'workbench.action.openGlobalSettings',
	'workbench.action.openSettingsJson',
	'workbench.action.openView',
	'workbench.action.openWorkspaceSettings',
	'workbench.action.openWorkspaceSettingsFile',
	'workbench.profiles.actions.help',
	'workbench.action.quickTextSearch',
	'workbench.extensions.action.refreshExtension',
	'editor.emmet.action.removeTag',
	'workbench.action.openIssueReporter',
	'workbench.action.reportPerformanceIssueUsingReporter',
	'workbench.action.showCommands',
	'workbench.extensions.action.listBuiltInExtensions',
	'workbench.extensions.action.showDisabledExtensions',
	'workbench.extensions.action.showEnabledExtensions',
	'workbench.extensions.action.listWorkspaceUnsupportedExtensions',
	'notifications.showList',
	'workbench.profiles.actions.showProfileContents',
	'workbench.action.remote.showMenu',
	'workbench.action.showWindowLog',
	'notifications.toggleDoNotDisturbMode',
	'notifications.toggleDoNotDisturbModeBySource',
	'editor.action.toggleStickyScroll',
	'editor.action.accessibilityHelp',
	'editor.action.accessibleView',
	'extension.js-debug.addXHRBreakpoints',
	'editor.emmet.action.balanceIn',
	'editor.emmet.action.balanceOut',
	'workbench.debug.panel.action.clearReplAction',
	'workbench.action.clearLocalePreference',
	'workbench.output.action.clearOutput',
	'json.clearCache',
	'search.action.clearHistory',
	'workbench.files.action.collapseExplorerFolders',
	'workbench.action.configureLocale',
	'workbench.action.openSnippets',
	'editor.emmet.action.decrementNumberByOneTenth',
	'editor.emmet.action.decrementNumberByOne',
	'editor.emmet.action.decrementNumberByTen',
	'workbench.action.localHistory.deleteAll',
	'extension.js-debug.disableSourceMapStepping',
	'extension.js-debug.editXHRBreakpoints',
	'editor.emmet.action.evaluateMathExpression',
	'workbench.action.populateFileFromSnippet',
	'references-view.findImplementations',
	'workbench.action.localHistory.restoreViaPicker',
	'workbench.action.findInFiles',
	'search.action.focusSearchList',
	'npm.focus',
	'workbench.panel.chat.view.copilot.focus',
	'~remote.forwardedPorts.focus',
	'workbench.action.problems.focus',
	'editor.emmet.action.matchTag',
	'editor.emmet.action.nextEditPoint',
	'editor.emmet.action.prevEditPoint',
	'accessibility.announcement.help',
	'signals.sounds.help',
	'editor.emmet.action.incrementNumberByOneTenth',
	'editor.emmet.action.incrementNumberByOne',
	'editor.emmet.action.incrementNumberByTen',
	'workbench.action.showInteractivePlayground',
	'extension.js-debug.createDebuggerTerminal',
	'vscode-testresolver.killServerAndTriggerHandledError',
	'editor.emmet.action.mergeLines',
	'ipynb.newUntitledIpynb',
	'search.action.openNewEditor',
	'vscode-testresolver.newWindow',
	'git.openAllChanges',
	'git.openChange',
	'extension.js-debug.debugLink',
	'workbench.action.openLogFile',
	'search.action.openNewEditorToSide',
	'search.action.openEditor',
	'workbench.action.webview.openDeveloperTools',
	'perf.event.profiling',
	'perf.insta.printAsyncCycles',
	'perf.insta.printTraces',
	'github.publish',
	'editor.emmet.action.reflectCSSValue',
	'workbench.files.action.refreshFilesExplorer',
	'extension.js-debug.removeAllCustomBreakpoints',
	'extension.js-debug.callers.removeAll',
	'extension.js-debug.callers.remove',
	'extension.js-debug.removeXHRBreakpoint',
	'workbench.action.replaceInFiles',
	'editor.emmet.action.selectNextItem',
	'editor.emmet.action.selectPrevItem',
	'simpleBrowser.show',
	'references-view.showCallHierarchy',
	'workbench.action.showEmmetCommands',
	'git.showOutput',
	'references-view.showIncomingCalls',
	'workbench.action.showLogs',
	'editor.action.showOrFocusStandaloneColorPicker',
	'references-view.showOutgoingCalls',
	'workbench.action.showOutputChannels',
	'workbench.action.showRuntimeExtensions',
	'references-view.showSubtypes',
	'references-view.showSupertypes',
	'vscode-testresolver.showLog',
	'references-view.showTypeHierarchy',
	'vscode-testresolver.toggleConnectionSlowdown',
	'json.sort',
	'editor.emmet.action.splitJoinTag',
	'git.diff.stageHunk',
	'git.diff.stageSelection',
	'extension.node-debug.startWithStopOnEntry',
	'perfview.show',
	'extension.node-debug.toggleAutoAttach',
	'editor.emmet.action.toggleComment',
	'extension.js-debug.addCustomBreakpoints',
	'workbench.action.toggleLockedScrolling',
	'workbench.action.toggleNotebookClipboardLog',
	'workbench.action.togglePanel',
	'extension.js-debug.toggleSkippingFile',
	'workbench.action.editorLayoutTwoColumnsBottom',
	'workbench.action.editorLayoutTwoColumns',
	'workbench.action.editorLayoutTwoRows',
	'workbench.action.editorLayoutTwoRowsRight',
	'workbench.action.unpinEditor',
	'editor.emmet.action.updateImageSize',
	'editor.emmet.action.updateTag',
	'workbench.action.openLicenseUrl',
	'editor.emmet.action.wrapWithAbbreviation',
	'workbench.action.zoomOut',
	'inlineChat.copyRecordings',
	'workbench.action.terminal.accessibleBufferGoToNextCommand',
	'workbench.action.addRootFolder',
	'search.action.cancel',
	'workbench.action.terminal.changeColor',
	'workbench.action.terminal.changeIcon',
	'workbench.action.editor.changeLanguageMode',
	'workbench.profiles.actions.cleanupProfiles',
	'workbench.action.terminal.clear',
	'workbench.action.chat.clearHistory',
	'workbench.action.chat.clearInputHistory',
	'workbench.action.terminal.clearPreviousSessionHistory',
	'workbench.action.terminal.clearSelection',
	'workbench.action.closeFolder',
	'workbench.files.action.compareFileWith',
	'workbench.action.terminal.openSettings',
	'workbench.action.copyEditorToNewWindow',
	'workbench.action.terminal.copyLastCommand',
	'workbench.action.terminal.copyLastCommandAndLastCommandOutput',
	'workbench.action.terminal.copyLastCommandOutput',
	'workbench.profiles.actions.createTemporaryProfile',
	'workbench.action.localHistory.create',
	'workbench.action.terminal.new',
	'workbench.action.terminal.newInActiveWorkspace',
	'workbench.action.createTerminalEditor',
	'workbench.action.createTerminalEditorSide',
	'workbench.action.terminal.newWithCwd',
	'workbench.action.decreaseViewSize',
	'workbench.action.decreaseViewHeight',
	'workbench.action.decreaseViewWidth',
	'workbench.action.terminal.fontZoomOut',
	'workbench.action.terminal.detachSession',
	'workbench.debug.viewlet.action.disableAllBreakpoints',
	'workbench.action.duplicateWorkspaceInNewWindow',
	'workbench.debug.viewlet.action.enableAllBreakpoints',
	'workbench.action.minimizeOtherEditorsHideSidebar',
	'workbench.action.chat.export',
	'workbench.action.terminal.findNext',
	'workbench.action.terminal.findPrevious',
	'breadcrumbs.focusAndSelect',
	'breadcrumbs.focus',
	'workbench.action.terminal.focusFind',
	'workbench.action.terminal.focusHover',
	'workbench.action.terminal.focusNext',
	'workbench.action.terminal.focusNextPane',
	'workbench.action.terminal.focusPrevious',
	'workbench.action.terminal.focusPreviousPane',
	'workbench.action.terminal.focus',
	'workbench.action.terminal.focusTabs',
	'workbench.action.terminal.goToRecentDirectory',
	'hideCustomTitleBar',
	'workbench.action.hideEditorActions',
	'workbench.action.hideEditorTabs',
	'workbench.action.terminal.hideFind',
	'workbench.action.chat.import',
	'workbench.action.increaseViewSize',
	'workbench.action.increaseViewHeight',
	'workbench.action.increaseViewWidth',
	'workbench.action.terminal.fontZoomIn',
	'workbench.action.chat.inlineVoiceChat',
	'workbench.action.chat.insertCodeBlock',
	'workbench.action.chat.insertIntoNewFile',
	'editor.action.insertSnippet',
	'workbench.action.terminal.join',
	'workbench.action.terminal.killAll',
	'workbench.action.terminal.killEditor',
	'workbench.action.terminal.kill',
	'workbench.action.lockEditorGroup',
	'workbench.action.maximizeEditorHideSidebar',
	'workbench.action.editorActionsTitleBar',
	'workbench.action.moveEditorToNewWindow',
	'workbench.action.terminal.moveToEditor',
	'workbench.action.terminal.moveIntoNewWindow',
	'workbench.action.chat.newChat',
	'workbench.action.chat.nextCodeBlock',
	'workbench.action.chat.nextFileTree',
	'workbench.action.debug.configure',
	'workbench.action.files.showOpenedFileInNewWindow',
	'workbench.action.chat.openInEditor',
	'workbench.action.chat.openInNewWindow',
	'workbench.action.chat.openInSidebar',
	'workbench.action.terminal.openDetectedLink',
	'workbench.action.openChat',
	'workbench.action.files.openFolder',
	'workbench.action.terminal.openFileLink',
	'workbench.action.terminal.openUrlLink',
	'workbench.action.openWorkspace',
	'workbench.action.files.openFileFolder',
	'workbench.action.chat.previousCodeBlock',
	'workbench.action.chat.previousFileTree',
	'workbench.action.quickOpenLeastRecentlyUsedEditorInGroup',
	'workbench.action.quickOpenPreviousRecentlyUsedEditorInGroup',
	'workbench.action.chat.quickVoiceChat',
	'workbench.action.terminal.recordSession',
	'workbench.action.terminal.relaunch',
	'workbench.action.removeRootFolder',
	'workbench.action.terminal.renameWithArg',
	'workbench.profiles.actions.renameProfile',
	'workbench.action.terminal.rename',
	'workbench.action.reopenTextEditor',
	'workbench.action.files.resetActiveEditorReadonlyInSession',
	'workbench.action.terminal.fontZoomReset',
	'workbench.profiles.actions.resetWorkspaces',
	'workbench.action.terminal.resizePaneDown',
	'workbench.action.terminal.resizePaneLeft',
	'workbench.action.terminal.resizePaneRight',
	'workbench.action.terminal.resizePaneUp',
	'workbench.action.terminal.restartPtyHost',
	'workbench.action.saveWorkspaceAs',
	'workbench.action.terminal.scrollDown',
	'workbench.action.terminal.scrollDownPage',
	'workbench.action.terminal.scrollToBottom',
	'workbench.action.terminal.scrollToNextCommand',
	'workbench.action.terminal.scrollToPreviousCommand',
	'workbench.action.terminal.scrollToTop',
	'workbench.action.terminal.scrollUp',
	'workbench.action.terminal.scrollUpPage',
	'workbench.action.terminal.selectAll',
	'workbench.action.terminal.selectDefaultShell',
	'workbench.action.terminal.selectToNextCommand',
	'workbench.action.terminal.selectToNextLine',
	'workbench.action.terminal.selectToPreviousCommand',
	'workbench.action.terminal.selectToPreviousLine',
	'workbench.action.toggleSeparatePinnedEditorTabs',
	'workbench.action.files.setActiveEditorReadonlyInSession',
	'workbench.action.files.setActiveEditorWriteableInSession',
	'workbench.action.terminal.setDimensions',
	'workbench.action.chat.history',
	'workbench.action.terminal.showEnvironmentContributions',
	'workbench.action.showEditorTab',
	'workbench.action.terminal.showTextureAtlas',
	'workbench.action.splitEditorInGroup',
	'workbench.action.terminal.split',
	'workbench.action.terminal.splitInActiveWorkspace',
	'workbench.action.editorDictation.start',
	'extension.bisect.start',
	'inlineChat.start',
	'workbench.action.terminal.chat.start',
	'workbench.action.startTrackDisposables',
	'workbench.action.chat.startVoiceChat',
	'workbench.action.quickOpenTerm',
	'workbench.action.terminal.switchTerminal',
	'workbench.action.files.toggleActiveEditorReadonlyInSession',
	'workbench.action.toggleCenteredLayout',
	'workbench.action.toggleEditorVisibility',
	'workbench.action.toggleEditorType',
	'workbench.action.toggleFullScreen',
	'workbench.action.toggleMaximizedPanel',
	'workbench.action.terminal.sizeToContentWidth',
	'workbench.action.toggleSplitEditorInGroup',
	'workbench.action.terminal.toggleStickyScroll',
	'workbench.action.toggleZenMode',
	'workbench.action.troubleshootIssue.start',
	'workbench.action.terminal.unsplit',
	'workbench.action.terminal.searchWorkspace',
	'workbench.action.terminal.toggleFindCaseSensitive',
	'workbench.action.terminal.toggleFindRegex',
	'workbench.action.terminal.toggleFindWholeWord',
	'workbench.action.chat.voiceChatInChatView',
	'workbench.action.terminal.writeDataToTerminal',
	'merge-conflict.accept.all-both',
	'merge-conflict.accept.all-current',
	'merge-conflict.accept.all-incoming',
	'merge-conflict.accept.both',
	'merge-conflict.accept.current',
	'merge-conflict.accept.incoming',
	'merge-conflict.accept.selection',
	'git.addRemote',
	'git.stashApplyLatest',
	'git.stashApply',
	'git.checkoutDetached',
	'git.checkout',
	'git.cherryPick',
	'git.clone',
	'git.cloneRecursive',
	'git.closeAllDiffEditors',
	'git.closeAllUnmodifiedEditors',
	'git.closeOtherRepositories',
	'git.close',
	'git.commit',
	'git.commitAmend',
	'git.commitSigned',
	'git.commitAll',
	'git.commitAllAmend',
	'git.commitAllSigned',
	'git.commitEmpty',
	'git.commitStaged',
	'git.commitStagedAmend',
	'git.commitStagedSigned',
	'merge-conflict.compare',
	'jupyter.continueEditSessionInCodespace',
	'issue.copyGithubHeadLink',
	'issue.copyGithubPermalink',
	'issue.copyMarkdownGithubPermalink',
	'git.branchFrom',
	'git.branch',
	'jupyter.createnewinteractive',
	'workbench.action.terminal.newWithProfile',
	'workbench.profiles.actions.createProfile',
	'git.createTag',
	'git.deleteBranch',
	'workbench.profiles.actions.deleteProfile',
	'git.deleteRemoteTag',
	'git.deleteTag',
	'git.cleanAll',
	'git.cleanAllTracked',
	'git.cleanAllUntracked',
	'git.clean',
	'git.stashDropAll',
	'git.stashDrop',
	'github.copilot.interactiveEditor.explain.palette',
	'workbench.profiles.actions.exportProfile',
	'git.fetch',
	'git.fetchPrune',
	'git.fetchAll',
	'jupyter.filterKernels',
	'github.copilot.interactiveEditor.fix',
	'github.copilot.interactiveEditor.generateDocs',
	'github.copilot.interactiveEditor.generateTests',
	'github.copilot.interactiveEditor.generate',
	'git.init',
	'git.merge',
	'merge-conflict.next',
	'git.openRepository',
	'git.stashPopLatest',
	'git.stashPop',
	'merge-conflict.previous',
	'git.publish',
	'git.pull',
	'git.pullRebase',
	'git.pullFrom',
	'git.push',
	'git.pushWithTags',
	'git.pushTags',
	'git.pushTo',
	'git.rebase',
	'git.refresh',
	'git.removeRemote',
	'git.renameBranch',
	'jupyter.resetLoggingLevel',
	'workbench.profiles.actions.createFromCurrentProfile',
	'jupyter.selectJupyterInterpreter',
	'github.copilot.interactiveSession.feedback',
	'workbench.panel.chatSidebar',
	'workbench.view.explorer',
	'workbench.view.extensions',
	'workbench.view.extension.github-pull-requests',
	'workbench.view.debug',
	'workbench.view.search',
	'workbench.view.scm',
	'git.stageAll',
	'git.stageAllMerge',
	'git.stageAllTracked',
	'git.stageAllUntracked',
	'git.stage',
	'git.stash',
	'git.stashIncludeUntracked',
	'git.stashStaged',
	'workbench.profiles.actions.switchProfile',
	'git.sync',
	'git.syncRebase',
	'workbench.panel.comments',
	'workbench.debug.action.toggleRepl',
	'workbench.action.output.toggleOutput',
	'~remote.forwardedPortsContainer',
	'workbench.actions.view.problems',
	'workbench.action.terminal.toggleTerminal',
	'workbench.editSessions.actions.signIn',
	'git.undoCommit',
	'git.unstageAll',
	'git.unstage',
	'git.viewChanges',
	'github.copilot.debug.contentExclusions',
	'git.viewStagedChanges',
	'git.stashView'
]);

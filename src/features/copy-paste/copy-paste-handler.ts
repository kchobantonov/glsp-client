/********************************************************************************
 * Copyright (c) 2019 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { inject, injectable } from "inversify";
import { TYPES } from "sprotty";
import { v4 as uuid } from "uuid";

import { EditorContextService } from "../../base/editor-context";
import { GLSP_TYPES } from "../../base/types";
import { GLSPActionDispatcher } from "../request-response/glsp-action-dispatcher";
import { ClipboardData, CutOperationAction, PasteOperationAction, RequestClipboardDataAction } from "./copy-paste-actions";

export interface ICopyPasteHandler {
    handleCopy(e: ClipboardEvent): void;
    handleCut(e: ClipboardEvent): void;
    handlePaste(e: ClipboardEvent): void;
}

export interface IAsyncClipboardService {
    clear(): void;
    put(data: ClipboardData, id?: string): void;
    get(id?: string): ClipboardData | undefined;
}

/**
 * A local implementation of the async clipboard interface.
 *
 * This implementation just stores the clipboard data in memory, but not in the clipboard.
 * This implementation can be used if you don't need to support cross-widget/browser/application
 * data transfer and you would like to avoid to require the permission of the user for accessing the
 * system clipboard asynchronously.
 *
 * In order to detect whether the user copied something else since we recorded the clipboard data
 * we put a uuid into the system clipboard synchronously. If on paste this ID has changed or is not
 * available anymore, we know that the user copied in another application or context, so we shouldn't
 * paste what we have stored locally and just return undefined.
 *
 * Real async clipboard service implementations can just ignore the ID that is passed and rely on the
 * system clipboard's content instead.
 */
@injectable()
export class LocalClipboardService implements IAsyncClipboardService {
    protected currentId?: string;
    protected data?: ClipboardData;

    clear() {
        this.currentId = undefined;
        this.data = undefined;
    }

    put(data: ClipboardData, id: string) {
        this.currentId = id;
        this.data = data;
    }

    get(id?: string): ClipboardData | undefined {
        if (id !== this.currentId) {
            return undefined;
        }
        return this.data;
    }
}

interface ClipboardId {
    readonly clipboardId: string;
}

function toClipboardId(clipboardId: string): string {
    return JSON.stringify({ clipboardId });
}

function isClipboardId(jsonData: any): jsonData is ClipboardId {
    return 'clipboardId' in jsonData;
}

function getClipboardIdFromDataTransfer(dataTransfer: DataTransfer): string | undefined {
    const jsonString = dataTransfer.getData(CLIPBOARD_DATA_FORMAT);
    const jsonObject = jsonString ? JSON.parse(jsonString) : undefined;
    return isClipboardId(jsonObject) ? jsonObject.clipboardId : undefined;
}

const CLIPBOARD_DATA_FORMAT = "application/json";

@injectable()
export class ServerCopyPasteHandler implements ICopyPasteHandler {

    @inject(TYPES.IActionDispatcher) protected actionDispatcher: GLSPActionDispatcher;
    @inject(GLSP_TYPES.IAsyncClipboardService) protected clipboadService: IAsyncClipboardService;
    @inject(EditorContextService) protected editorContext: EditorContextService;

    handleCopy(e: ClipboardEvent) {
        if (e.clipboardData && this.shouldCopy(e)) {
            const clipboardId = uuid();
            e.clipboardData.setData(CLIPBOARD_DATA_FORMAT, toClipboardId(clipboardId));
            this.actionDispatcher
                .request(RequestClipboardDataAction.create(this.editorContext.get()))
                .then(action => this.clipboadService.put(action.clipboardData, clipboardId));
            e.preventDefault();
        } else {
            if (e.clipboardData) { e.clipboardData.clearData(); }
            this.clipboadService.clear();
        }
    }

    handleCut(e: ClipboardEvent): void {
        if (e.clipboardData && this.shouldCopy(e)) {
            this.handleCopy(e);
            this.actionDispatcher.dispatch(new CutOperationAction(this.editorContext.get()));
            e.preventDefault();
        }
    }

    handlePaste(e: ClipboardEvent): void {
        if (e.clipboardData) {
            const clipboardId = getClipboardIdFromDataTransfer(e.clipboardData);
            const clipboardData = this.clipboadService.get(clipboardId);
            if (clipboardData) {
                this.actionDispatcher
                    .dispatch(new PasteOperationAction(clipboardData, this.editorContext.get()));
            }
            e.preventDefault();
        }
    }

    protected shouldCopy(e: ClipboardEvent) {
        return this.editorContext.get().selectedElementIds.length > 0
            && (e.srcElement instanceof HTMLBodyElement || e.srcElement instanceof SVGElement);
    }

}
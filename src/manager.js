'use strict';

import {
    cursorState,
    getCursorPos,
    setGlobalCursorStyle,
} from './cursor';
import Timer from './timer.js';


const NO_WINDOW = -1;

const DialogInterface = {
    methods: [
        'showTooltip',
        'closeTooltip',
        'updateWindowFocus',
        'updateWindowZIndex',
        'updateWindowSize',
        'updateWindowPosition',
        'getCursorState',
        'moveBegin',
        'moveEnd',
        'pushTitlebarButton',
        'releaseTitlebarButton',
        'handleTitlebarButtonClick'
    ],
    properties: [
        'cursorOnTitlebarButtons',
        'tooltipTitlebarButton',
        'hoverTitlebarButton',
        'cursorOnWindow',
        'cursorOnTitlebar',
        'cursorOnTitlebarButtons',
        'isMaximized',
        'isMinimized'
    ],
    implements: (obj) => {
        const objMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(obj))
                              .concat(Object.keys(obj).filter(item => typeof obj[item] === 'function'));
        const objProperties = Object.keys(obj).filter(item => typeof obj[item] !== 'function');

        let notImplemented = [];    

        for (let symbol of DialogInterface.methods) {
            if (!objMethods.includes(symbol))
                notImplemented.push(symbol);
        }

        for (let symbol of DialogInterface.properties) {
            if (!objProperties.includes(symbol))
                notImplemented.push(symbol);
        }

        console.log(notImplemented);

        if (notImplemented.length)
            return false;

        return true;
    }
};


/**
 * Class that represents a lightweight window manager. This manager
 * supports dialog objects that implement the methods and properties defined
 * in the DialogInterface object.
 */
export default class WindowManager {

    constructor() {
        this.windows = [];
        this.zIndexTop = 0;

        this.currCursor = cursorState.regular;
        this.moveAction = this._defaultMouseMove;

        this.cursorPos = null;

        this.activeWindow = NO_WINDOW;
        this.pressedButton = -1;
        this.rightClickTitlebar = false;

        this.showTooltipTimer = new Timer(1000, this._showTooltip);
        this.closeTooltipTimer = new Timer(4000, this._resetTooltip);
        this.windowWithVisibleTooltip = NO_WINDOW;

        setGlobalCursorStyle(this.currCursor);
        window.addEventListener('mousemove', this._onMouseMove, true);
        window.addEventListener('mouseup', this._onMouseUp, true);
        window.addEventListener('mousedown', this._onMouseDown, true);
    }

    registerWindow(w) {
        if (DialogInterface.implements(w)) {

            if (this.zIndexTop > 0) {
                this.windows[this.zIndexTop - 1].updateWindowFocus(false);
            }

            if (this.windows.length === this.zIndexTop) {
                this.windows.push(w);
            } else {
                this.windows[this.zIndexTop] = w;
            }

            w.updateWindowFocus(true);
            w.updateWindowZIndex(this.zIndexTop);

            return this.zIndexTop++;
        }

        console.log(`WindowManager.registerWindow error: Invalid window argument '${w}'.`);
        return NO_WINDOW;
    }

    unregisterWindow(zIndex) {
        if (zIndex >= 0 && zIndex < this.zIndexTop) {

            this._bringWindowToTop(zIndex);

            this.windows[this.zIndexTop--] = null;

        } else {
            console.log(`WindowManager.unregisterWindow error: Invalid zIndex argument '${zIndex}'.`);
        }
    }

    _bringWindowToTop = (zIndex) => {
        const topZIndex = this.zIndexTop - 1;
        let topWindow = this.windows[zIndex];

        for (let i = zIndex; i < topZIndex; i++) {
            this.windows[i] = this.windows[i + 1];
            this.windows[i + 1] = topWindow;

            this.windows[i].updateWindowZIndex(i);
            this.windows[i].updateWindowFocus(false);
        }

        topWindow.updateWindowZIndex(topZIndex);
        topWindow.updateWindowFocus(true);
    }

    _resetCursor = () => {
        if (this.currCursor !== cursorState.regular) {
            setGlobalCursorStyle(cursorState.regular, this.currCursor);
            this.currCursor = cursorState.regular;
        }
    }

    _resetTooltip = () => {
        if (this.windowWithVisibleTooltip !== NO_WINDOW) {
            this.windows[this.windowWithVisibleTooltip].closeTooltip();
            this.showTooltipTimer.cancel();
            this.closeTooltipTimer.cancel();
            this.windowWithVisibleTooltip = NO_WINDOW;
        }
    }

    _showTooltip = (zIndex) => {
        this.windows[zIndex].showTooltip(this.cursorPos);
        this.windowWithVisibleTooltip = zIndex;
        this.closeTooltipTimer.start();
    }

    _handleHoverOnWindow = (ev, zIndex) => {
        if (this.windows[zIndex].cursorOnTitlebarButtons) {
            this._resetCursor();
            this.cursorPos = getCursorPos(ev);

            if (this.windowWithVisibleTooltip === zIndex) {
                if (this.windows[zIndex].tooltipTitlebarButton !== this.windows[zIndex].hoverTitlebarButton) {
                    this._resetTooltip();
                    this._showTooltip(zIndex);
                }
            } else {
                this._resetTooltip();
                this.showTooltipTimer.start(zIndex);
            }
        } else {
            this._resetTooltip();

            let cursorState = this.windows[zIndex].getCursorState(getCursorPos(ev));

            if (cursorState !== this.currCursor) {
                setGlobalCursorStyle(cursorState, this.currCursor);
                this.currCursor = cursorState;
            }
        }
    }

    _moveWindow = (ev) => {
        this.windows[this.activeWindow].updateWindowPosition(getCursorPos(ev));
    }

    _resizeWindow = (ev) => {
        this.windows[this.activeWindow].updateWindowSize(this.currCursor, getCursorPos(ev));
    }

    _titlebarButtonMouseMove = (ev) => {
        if (this.windows[this.activeWindow].hoverTitlebarButton !== this.pressedButton) {
            this.windows[this.activeWindow].releaseTitlebarButton();
        } else {
            this.windows[this.activeWindow].pushTitlebarButton();
        }
    }

    _defaultMouseMove = (ev) => {
        for (let i = 0; i < this.zIndexTop; i++) {
            if (this.windows[i].cursorOnWindow)
                return this._handleHoverOnWindow(ev, i);
        }

        this._resetTooltip();
        this._resetCursor();
    }

    _onMouseMove = (ev) => {
        this.moveAction(ev);
    }

    _onMouseUp = (ev) => {
        //handle right click mouseup events
        if (ev.button === 0) {
            if (this.moveAction === this._moveWindow) {
                this.windows[this.activeWindow].moveEnd();
            } else if (this.moveAction === this._titlebarButtonMouseMove) {
                this.windows[this.activeWindow].releaseTitlebarButton();
                if (this.windows[this.activeWindow].hoverTitlebarButton === this.pressedButton) {
                    this.windows[this.activeWindow].handleTitlebarButtonClick(this.pressedButton);
                }
            }
        } else if (ev.button === 2 && this.rightClickTitlebar) {
            if (this.windows[this.activeWindow].cursorOnTitlebar)
                console.log('menu opened');
            this.rightClickTitlebar = false;
            ev.preventDefault();
        }

        this.activeWindow = NO_WINDOW;
        this.moveAction = this._defaultMouseMove;
    }

    _onMouseDown = (ev) => {
        this.showTooltipTimer.cancel();

        for (let i = 0; i < this.zIndexTop; i++) {
            if (this.windows[i].cursorOnWindow) {

                if (ev.button === 0) {
                    if (this.currCursor === cursorState.regular) {

                        if (this.windows[i].cursorOnTitlebar) {
                            if (this.windows[i].cursorOnTitlebarButtons) {
                                this.windows[i].closeTooltip();
                                this.pressedButton = this.windows[i].pushTitlebarButton();
                                this.moveAction = this._titlebarButtonMouseMove;
                            } else {
                                if (!this.windows[i].isMaximized) {
                                    this.moveAction = this._moveWindow;
                                    this.windows[i].moveBegin(getCursorPos(ev));
                                }
                            }
                        }

                    } else {
                        if (!this.windows[i].isMaximized && !this.windows[i].isMinimized) {
                            this.moveAction = this._resizeWindow;
                        }
                    }
                } else if (ev.button === 2 && this.windows[i].cursorOnTitlebar) {
                    this.rightClickTitlebar = true;
                    this.moveAction = () => {};
                }

                this.activeWindow = i;

                break;
            }
        }

        if (this.activeWindow !== NO_WINDOW) {
            this._bringWindowToTop(this.activeWindow);
            this.activeWindow = this.zIndexTop - 1;
        } else {
            this.windows[this.zIndexTop - 1].updateWindowFocus(false);
        }

        if (this.moveAction !== this._defaultMouseMove)
            ev.preventDefault();
    }

    toString() {
        return `WindowManager = {\n` +
               `    this.zIndexTop =  ${this.zIndexTop},\n` +
               `    this.currCursor = ${this.currCursor},\n` +
               `    this.moveAction = ${this.moveAction},\n` +
               `    this.cursorPos = ${this.cursorPos},\n` +
               `    this.activeWindow = ${this.activeWindow},\n` +
               `    this.pressedButton = ${this.pressedButton},\n` +
               `    this.rightClickTitlebar = ${this.rightClickTitlebar},\n` +
               `    this.windowWithVisibleTooltip = ${this.windowWithVisibleTooltip},\n` +
               `}`;
    }
}

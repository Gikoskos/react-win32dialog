/**
 * @module manager
 */
'use strict';

import {
    cursorState,
    getCursorPos,
    setGlobalCursorStyle,
} from './cursor';
import { titlebarButtons } from './titlebarbutton';
import { NO_VALUE } from './globals';
import Timer from './timer';


/**
 * The names of the methods and properties that should be implemented by
 * dialogs that are used from the WindowManager observer class.
 *
 * This object is used purely for testing purposes. 
 * Objects that are registered to the window manager can choose on whether they want
 * the manager to perform a runtime validity check on them or not, to see whether
 * they inherit all the properties and methods that the manager requires.
 * See the registerWindow method.
 */
const DialogInterface = {
    methods: [
        'showTooltip',
        'closeTooltip',
        'updateWindowFocus',
        'updateWindowZIndex',
        'updateWindowSize',
        'updateWindowPosition',
        'getCursorState',
        'setupCursorOffset',
        'fixOffScreenMove',
        'pushTitlebarButton',
        'releaseTitlebarButton',
        'handleTitlebarButtonClick',
        'isTitleOverflowing'
    ],
    properties: [
        'tooltipOnTitlebarButton',
        'hoverTitlebarButton',
        'cursorOnWindow',
        'cursorOnTitlebar',
        'cursorOnTitlebarButtons',
        'isMaximized',
        'isMinimized'
    ],
    /**
     * This method performs a runtime check to see if the
     * given parameter is an object that implements the Dialog symbols.
     * Only for testing purposes.
     */
    implements: (obj) => {
        const objMethods = Object
                            .getOwnPropertyNames(Object.getPrototypeOf(obj))
                            .concat(Object
                                    .keys(obj)
                                    .filter(item => typeof obj[item] === 'function'));
        const objProperties = Object
                                .keys(obj)
                                .filter(item => typeof obj[item] !== 'function');

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
 * supports dialog objects that implement the methods and properties declared
 * in the DialogInterface object.
 *
 * How it works: The manager sets 3 event listeners for basic mouse
 * events (move, up, down) and notifies any window registered
 * to this manager, if needed, using the observer/listener pattern. With
 * this design, the windows won't react to anything by themselves. They wait
 * for the manager to instruct them to change state.
 *
 * Stacking of windows is supported by giving each window a unique z-index.
 * To uniquely identify a window within the window manager, we use that window's
 * z-index.
 * By stacking windows on top of each other, it's guaranteed that only one
 * window has focus at each given moment.
 * @package
 */
export default class WindowManager {

    constructor() {
        /**
         * Array of all windows registered to this manager.
         * @private
         */
        this.windows = [];
        /**
         * The z-index of the window that will be registered next.
         * This _isn't_ the same as the length of the windows array, but
         * is guaranteed to be less than or equal to it.
         * See the register/unregister methods below.
         * @private
         */
        this.zIndexTop = 0;

        /**
         * The cursor's current state.
         * @private
         */
        this.currCursor = cursorState.regular;

        /**
         * Callback that points to the handler that is called
         * by the mousemove event.
         * @private
         */
        this.moveAction = this._defaultMouseMove;

        /**
         * The cursor's position. This is currently only
         * used for the tooltip.
         * @private
         */
        this.cursorPos = null;

        /**
         * The z-index of the window that is/was clicked.
         * @private
         */
        this.activeWindow = NO_VALUE;

        /**
         * Takes values from {@module:titlebarbutton/titlebarButtons}
         * @private
         */
        this.pressedButton = -1;

        /**
         * True if the user right-clicked on the titlebar. False otherwise.
         */
        this.rightClickTitlebar = false;

        /**
         * A tooltip appears when this timer is finished.
         * @private
         */
        this.showTooltipTimer = new Timer(1000, this._showTooltip);

        /**
         * The tooltip that was showed is destroyed after this timer is finished.
         * @private
         */
        this.closeTooltipTimer = new Timer(4000, this._resetTooltip);

        /**
         * @private
         */
        this.windowWithVisibleTooltip = NO_VALUE;

        /**
         * @private
         */
        this.maximizedWindow = NO_VALUE;

        setGlobalCursorStyle(this.currCursor);
        window.addEventListener('mousemove', this._onMouseMove, true);
        window.addEventListener('mouseup', this._onMouseUp, true);
        window.addEventListener('mousedown', this._onMouseDown, true);
        window.addEventListener('dblclick', this._onDoubleClick, true);
        window.addEventListener('resize', this._onResize, false);
    }

    /**
     * @param {module:dialog/Win32Dialog} w
     * @param {boolean} checkInheritance
     * @package
     */
    registerWindow(w, checkInheritance = false) {
        if (!checkInheritance || DialogInterface.implements(w)) {

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
        return NO_VALUE;
    }

    /**
     * @param {number} zIndex The window's z-index.
     * @package
     */
    unregisterWindow(zIndex) {
        if (zIndex >= 0 && zIndex < this.zIndexTop) {

            this._bringWindowToTop(zIndex);

            this.windows[this.zIndexTop--] = null;

        } else {
            console.log(`WindowManager.unregisterWindow error: Invalid zIndex argument '${zIndex}'.`);
        }
    }

    /**
     * @param {number} zIndex The window's z-index.
     * @private
     */
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

    /**
     * @private
     */
    _resetCursor = () => {
        if (this.currCursor !== cursorState.regular) {
            setGlobalCursorStyle(cursorState.regular, this.currCursor);
            this.currCursor = cursorState.regular;
        }
    }

    /**
     * @private
     */
    _resetTooltip = () => {
        this.showTooltipTimer.cancel();
        this.closeTooltipTimer.cancel();

        if (this.windowWithVisibleTooltip !== NO_VALUE) {
            this.windows[this.windowWithVisibleTooltip].closeTooltip();
            this.windowWithVisibleTooltip = NO_VALUE;
        }
    }

    /**
     * @private
     */
    _showTooltip = (zIndex) => {
        if (this.windows[zIndex].showTooltip(this.cursorPos)) {
            this.windowWithVisibleTooltip = zIndex;
            this.closeTooltipTimer.start();
        }
    }

    /**
     * @private
     */
    _handleHoverOnWindow = (ev, zIndex) => {
        const win = this.windows[zIndex];

        this.cursorPos = getCursorPos(ev);

        let windowCursor = win.getCursorState(this.cursorPos);

        if (!win.isMaximized && !win.isMinimized) {
            if (windowCursor !== this.currCursor) {
                setGlobalCursorStyle(windowCursor, this.currCursor);
                this.currCursor = windowCursor;
            }
        }

        if (windowCursor === cursorState.regular && win.cursorOnTitlebar) {
            this._resetCursor();


            if (!win.cursorOnTitlebarButtons && win.isTitleOverflowing()) {

                if (this.windowWithVisibleTooltip === zIndex) {    
                    if (!win.tooltipOnTitle) {
                        this._resetTooltip();
                        this._showTooltip(zIndex);
                    }
                } else {
                    this._resetTooltip();
                    this.showTooltipTimer.start(zIndex);
                }

            } else {
                if (win.hoverTitlebarButton === NO_VALUE) {
                    win.hoverTitlebarButton = titlebarButtons.maximize;
                }

                if (this.windowWithVisibleTooltip === zIndex) {
                    if (win.tooltipOnTitlebarButton !== win.hoverTitlebarButton) {
                        this._resetTooltip();
                        this._showTooltip(zIndex);
                    }
                } else {
                    this._resetTooltip();
                    this.showTooltipTimer.start(zIndex);
                }
            }

        } else {
            this._resetTooltip();
        }
    }

    /**
     * @private
     */
    _moveWindow = (ev) => {
        this.windows[this.activeWindow].updateWindowPosition(getCursorPos(ev));
    }

    /**
     * @private
     */
    _resizeWindow = (ev) => {
        this.windows[this.activeWindow].updateWindowSize(getCursorPos(ev), this.currCursor);
    }

    /**
     * @private
     */
    _titlebarButtonMouseMove = (ev) => {
        const win = this.windows[this.activeWindow];

        if (win.hoverTitlebarButton !== this.pressedButton) {
            win.releaseTitlebarButton();
        } else {
            win.pushTitlebarButton();
        }
    }

    /**
     * @private
     */
    _defaultMouseMove = (ev) => {
        for (let i = 0; i < this.zIndexTop; i++) {
            if (this.windows[i].cursorOnWindow)
                return this._handleHoverOnWindow(ev, i);
        }

        this._resetTooltip();
        this._resetCursor();
    }

    /**
     * @private
     */
    _onMouseMove = (ev) => {
        this.moveAction(ev);
    }

    /**
     * @private
     */
    _onMouseUp = (ev) => {
        const win = this.windows[this.activeWindow];

        //handle right click mouseup events
        if (ev.button === 0) {
            if (this.moveAction === this._moveWindow) {
                win.fixOffScreenMove();
            } else if (this.moveAction === this._titlebarButtonMouseMove) {
                win.releaseTitlebarButton();
                if (win.hoverTitlebarButton === this.pressedButton) {
                    win.handleTitlebarButtonClick(this.pressedButton);
                }
            }
        } else if (ev.button === 2 && this.rightClickTitlebar) {
            if (win.cursorOnTitlebar)
                console.log('Titlebar context menu not yet implemented :)');
            this.rightClickTitlebar = false;
            ev.preventDefault();
        }

        this.activeWindow = NO_VALUE;
        this.moveAction = this._defaultMouseMove;
    }

    /**
     * @private
     */
    _onMouseDown = (ev) => {
        let win;

        this.showTooltipTimer.cancel();
        this._resetTooltip();

        for (let i = 0; i < this.zIndexTop; i++) {
            win = this.windows[i];

            if (win.cursorOnWindow) {

                if (ev.button === 0) {
                    if (this.currCursor === cursorState.regular) {

                        if (win.cursorOnTitlebar) {
                            if (win.cursorOnTitlebarButtons) {
                                this.pressedButton = win.pushTitlebarButton();
                                this.moveAction = this._titlebarButtonMouseMove;
                            } else {
                                if (!win.isMaximized) {
                                    this.moveAction = this._moveWindow;
                                    win.setupCursorOffset(getCursorPos(ev));
                                }
                            }
                        }

                    } else {
                        if (!win.isMaximized && !win.isMinimized) {
                            this.moveAction = this._resizeWindow;
                            win.setupCursorOffset(getCursorPos(ev), this.currCursor);
                        }
                    }
                } else if (ev.button === 2) {
                    if (!win.cursorOnTitlebarButtons && win.cursorOnTitlebar) {
                        this.rightClickTitlebar = true;
                        this.moveAction = () => {};
                    }
                }

                this.activeWindow = i;

                break;
            }
        }

        if (this.activeWindow !== NO_VALUE) {
            this._bringWindowToTop(this.activeWindow);
            this.activeWindow = this.zIndexTop - 1;
        } else {
            this.windows[this.zIndexTop - 1].updateWindowFocus(false);
        }

        if (this.moveAction !== this._defaultMouseMove)
            ev.preventDefault();
    }

    /**
     * @private
     */
    _onDoubleClick = (ev) => {
        let win;

        this.cursorPos = getCursorPos(ev);

        for (let i = 0; i < this.zIndexTop; i++) {
            win = this.windows[i];

            if (win.cursorOnTitlebar && !win.cursorOnTitlebarButtons &&
                win.getCursorState(this.cursorPos) === cursorState.regular) {
                win.handleTitlebarButtonClick(titlebarButtons.maximize);
            }
        }
    }

    /**
     * @private
     */
    _onResize = () => {
        let topWin = this.windows[this.zIndexTop - 1];

        if (topWin.isMaximized) {
            topWin.updateWindowSize({
                x: window.innerWidth,
                y: window.innerHeight
            }, cursorState.bottomright);
        }
    }

    /**
     * @package
     */
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

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
        'isTitleOverflowing',
        'maximize'
    ],
    properties: [
        'tooltipOnTitlebarButton',
        'tooltipOnTitle',
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
         * The windows in this array, act as listeners to the commands
         * of the window manager.
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
         * by the mousemove event. The 3 handlers for the mousemove event
         * are _defaultMouseMove, _resizeWindow and _moveWindow.
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
         * The z-index of the window that has a visible tooltip.
         * @private
         */
        this.windowWithVisibleTooltip = NO_VALUE;

        /**
         * The z-index of the window that is currently maximized.
         * @private
         */
        this.maximizedWindow = NO_VALUE;

        /**
         * The z-index of the window that is currently active. The active
         * window is in the middle of an action such as resizing/moving.
         * @private
         */
        this.activeWindow = NO_VALUE;

        setGlobalCursorStyle(this.currCursor);
        window.addEventListener('mousemove', this._onMouseMove, true);
        window.addEventListener('mouseup', this._onMouseUp, true);
        window.addEventListener('mousedown', this._onMouseDown, true);
        window.addEventListener('dblclick', this._onDoubleClick, true);
        window.addEventListener('resize', this._onResize, false);
    }

    /**
     * Registers the window w to this window manager instance, and
     * brings it to the top of the window stack with focus.
     * If the array doesn't have any empty positions (possibly from
     * other windows that unregistered), then we change the array's
     * size by pushing the window on the last position.
     * @param {module:dialog/Win32Dialog} w
     * @param {boolean} checkInheritance
     * @package
     */
    registerWindow(w, checkInheritance = false) {
        if (!checkInheritance /*|| DialogInterface.implements(w)*/) {

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
     * If the zIndex window is registered to this window manager, then
     * bring it to the top and remove it from the listener array.
     * Note that the listener array size _doesn't_ change (it doesn't get
     * smaller). The array remains the same but the zIndexTop property goes
     * down.
     * @param {number} zIndex
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
     * Bring the zIndex window to the top of the stack
     * and change the z-indexes of the other windows accordingly.
     * @param {number} zIndex
     * @private
     */
    _bringWindowToTop(zIndex) {
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
     * Sets the global cursor to the default, if it's not already
     * set to the default.
     * @private
     */
    _resetCursor() {
        if (this.currCursor !== cursorState.regular) {
            setGlobalCursorStyle(cursorState.regular, this.currCursor);
            this.currCursor = cursorState.regular;
        }
    }

    /**
     * Closes the open tooltip, if there is one, and cancels all
     * tooltip timers.
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
     * Shows the tooltip and starts the timer that will close it.
     * @private
     */
    _showTooltip = (zIndex) => {
        if (this.windows[zIndex].showTooltip(this.cursorPos, this.zIndexTop)) {
            this.windowWithVisibleTooltip = zIndex;
            this.closeTooltipTimer.start();
        }
    }

    /**
     * Handler that is called when the mouse is hovering on any
     * of the windows registered to this window manager.
     *
     * The behavior of this handler is programmed to be as close
     * as possible to the behavior of actual dialog boxes from
     * the classic style of Windows.
     *
     * As point of reference I used the classic style windows in Windows 7.
     * @private
     */
    _handleHoverOnWindow (ev, zIndex) {
        //cache the current window's lookup
        const win = this.windows[zIndex];

        //store the current position of the cursor
        this.cursorPos = getCursorPos(ev);

        //get the position of the cursor relative to the window
        let windowCursor = win.getCursorState(this.cursorPos);

        //change the cursor's style, if it's hovering on any of the
        //borders and it's not in maximized/minimized state
        if (!win.isMaximized && !win.isMinimized) {
            if (windowCursor !== this.currCursor) {
                setGlobalCursorStyle(windowCursor, this.currCursor);
                this.currCursor = windowCursor;
            }
        }

        //if the cursor isn't hovering on the window's borders, it might
        //be hovering on an area that has a tooltip
        if (windowCursor === cursorState.regular && win.cursorOnTitlebar) {
            //first make sure to reset the cursor back to the default
            this._resetCursor();

            //there are three possible cases:
            //   i) the cursor is hovering on top of the titlebar buttons
            //  ii) the cursor is hovering on top of the titlebar and the
            //      titlebar's title is truncated
            // iii) the cursor is hovering on top of the titlebar and the
            //      titlebar's title is fully visible
            if (!win.cursorOnTitlebarButtons && win.isTitleOverflowing()) {
                //second case where the pointer isn't above any of the titlebar
                //buttons, and the window title isn't fully displayed (i.e.
                //truncated due to the window's size being too small possibly)

                if (this.windowWithVisibleTooltip === zIndex) {
                    if (!win.tooltipOnTitle) {
                        this._resetTooltip();
                        this._showTooltip(zIndex);
                    }
                } else {
                    this._resetTooltip();
                    this.showTooltipTimer.start(zIndex);
                }

            } else if (win.cursorOnTitlebarButtons) {
                //First case where the pointer is hovering on the titlebar buttons.
                //Due to the design of the tooltip mechanics, this can also
                //be used for the third case. In that case the tooltip timer will
                //fire up but the tooltip won't get displayed. The Win32Dialog
                //class will see that the cursor isn't hovering on any of the buttons,
                //so it won't display the tooltip.
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
            } else {
                this._resetTooltip();
            }

        } else {
            this._resetTooltip();
        }
    }

    /**
     * Is called when there's an active moving window, and a
     * mouse move event occurs.
     * @private
     */
    _moveWindow(ev) {
        this.windows[this.activeWindow].updateWindowPosition(getCursorPos(ev));
    }

    /**
     * Is called when there's an active resizing window, and a
     * mouse move event occurs.
     * @private
     */
    _resizeWindow(ev) {
        this.windows[this.activeWindow].updateWindowSize(getCursorPos(ev), this.currCursor);
    }

    /**
     * Is called when there's a mouse move event while the pointer
     * is clicked on any of the titlebar buttons, of a window.
     * @private
     */
    _titlebarButtonMouseMove() {
        const win = this.windows[this.activeWindow];

        if (win.hoverTitlebarButton !== this.pressedButton) {
            win.releaseTitlebarButton();
        } else {
            win.pushTitlebarButton();
        }
    }

    /**
     * Is called when there's a mouse move event and no windows are
     * active.
     * @private
     */
    _defaultMouseMove(ev) {
        //check if the cursor is hovering over any of the windows
        //registered to this window manager
        for (let i = 0; i < this.zIndexTop; i++) {
            //if we found a window that has the pointer on top
            //of it, then we return with the hover handler
            if (this.windows[i].cursorOnWindow)
                return this._handleHoverOnWindow(ev, i);
        }

        //reset the tooltip and cursor states if the pointer isn't
        //hovering over any windows
        this._resetTooltip();
        this._resetCursor();
    }

    /**
     * Stub handler that is called by the mouse move event.
     * It calls the actual handler that is used at the point
     * the event occured.
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

        //handle left click mouseup events
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
     * Handler that is called on the double click event.
     * Checks if the double click event occured on the titlebar
     * area of any of the windows registered to this window manager.
     * In that case, it calls the maximize button handler for that
     * window.
     * @private
     */
    _onDoubleClick = (ev) => {
        if (ev.button !== 0) {
            return;
        }

        let win;

        //this.cursorPos = getCursorPos(ev);

        for (let i = 0; i < this.zIndexTop; i++) {
            win = this.windows[i];

            if (win.cursorOnTitlebar && !win.cursorOnTitlebarButtons) {
                this._resetCursor();
                win.handleTitlebarButtonClick(titlebarButtons.maximize);
            }
        }
    }

    /**
     * Handler that is called when the viewport is resized.
     * @private
     */
    _onResize = () => {
        let topWin = this.windows[this.zIndexTop - 1];

        if (topWin.isMaximized) {
            topWin.maximize();
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

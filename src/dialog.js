/**
 * @module dialog
 */
'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import DialogRect from './rect';
import WindowManager from './manager';
import Tooltip from './tooltip';
import { cursorState }  from './cursor';
import {
    titlebarButtons,
    TitlebarButton,
} from './titlebarbutton';
import {
    NO_VALUE,
    getViewportWidth
} from './globals';


import defaultTitlebarIcon from './assets/default-titlebar-icon.png';
import defaultCloseIcon from './assets/default-close-icon.png';
import defaultMinimizeIcon from './assets/default-minimize-icon.png';
import defaultMaximizeIcon from './assets/default-maximize-icon.png';
import defaultRestoreIcon from './assets/default-restore-icon.png';


/**
 * A React component that renders a resizeable/moveable dialog box
 * with a classic Windows aesthetic.
 */
export default class Win32Dialog extends React.Component {
    static propTypes = {
        /**
         * Initial x position of the dialog within the viewport.
         * Default value is 1.
         */
        x: PropTypes.number,
        /**
         * Initial y position of the dialog within the viewport.
         * Default value is 1.
         */
        y: PropTypes.number,
        /**
         * Initial width.
         * The default value is the dialog's minimum width.
         */
        width: PropTypes.number,
        /**
         * Initial height.
         * The default value is the dialog's minimum height.
         */
        height: PropTypes.number,
        /**
         * Minimum width that the dialog can have.
         * @see {module:rect/defaultRect} for the default value.
         */
        minWidth: PropTypes.number,
        /**
         * Minimum height that the dialog can have.
         * @see {module:rect/defaultRect} for the default value.
         */
        minHeight: PropTypes.number,
        /**
         * Width of the dialog's outer border.
         * @see {module:rect/defaultRect} for the default value.
         */
        borderWidth: PropTypes.number,
        /** Text that is displayed on the dialog's titlebar. */
        title: PropTypes.string,
        /** Icon that is displayed on the dialog's titlebar. */
        icon: PropTypes.string,
        /** 
         * Is called when the dialog's X button is pressed.
         * If it's defined, it should return a truthy value for
         * the dialog to exit. If it returns falsy, the X button
         * doesn't close the dialog.
         */
        onExit: PropTypes.func,
        /** Is called when the dialog loses focus. */
        onBlur: PropTypes.func,
        /** Is called when the dialog gains focus. */
        onFocus: PropTypes.func,
    };

    static defaultProps = {
        title: 'React Win32 dialog box',
        icon: defaultTitlebarIcon,
    };

    static tooltipMessages = ['Minimize', 'Maximize', 'Close', 'Restore Down'];

    //Initialize the window manager. Only one instance
    //of the window manager should be running at any given point.
    static windowManager = new WindowManager();


    constructor(props) {
        super(props);

        /**
         * A DialogRect object that stores the dimensions of the dialog box.
         * Operations like resize/move happen on the DialogRect object first, before
         * they are updated on the Win32Dialog object's state.
         * @private
         */
        this.rc = new DialogRect(this.props.x,
                                 this.props.y,
                                 this.props.width,
                                 this.props.height,
                                 this.props.minWidth,
                                 this.props.minHeight,
                                 this.props.borderWidth);

        /**
         * React component state.
         * @private
         */
        this.state = {
            //CSS state start
            width: this.rc.width,
            height: this.rc.height,
            top: this.rc.top,
            left: this.rc.left,
            borderWidth: this.rc.borderWidth,
            zIndex: 0,
            //CSS state end

            /**
             * If true then the dialog and its titlebar, have no border.
             * Is used when the dialog is maximized and we need both the outer
             * border and titlebar border to disappear.
             */
            noBorder: false,

            /**
             * Is true only when the dialog has mouse focus.
             */
            hasFocus: false,

            /**
             * Is true only when the user pressed the X button.
             * If true then this component will always render null.
             */
            hasClosed: false,

            /**
             * If any of the titlebar buttons is pushed, this property
             * takes values from the titlebarButtons object.
             * The default value is NO_VALUE which means that no buttons are pushed.
             */
            activeTitlebarButton: NO_VALUE,

            /**
             * This object is passed as a prop to the tooltip component.
             */
            tooltipArgs: {
                /**
                 * The text that is displayed in the tooltip.
                 */
                msg: '',
                /**
                 * The tooltip needs to know the cursor's position
                 * since it is displayed right underneath it.
                 * This also serves as a flag because when it's null,
                 * the tooltip isn't displayed.
                 */
                position: null,
                /**
                 * The tooltip's z-index. This should be the z-index of
                 * the dialog that is on top (the one that has focus), plus 1.
                 */
                zIndex: 0
            },

            /**
             * The maximize icon changes if the window is maximized
             * so we keep it in the object's state.
             */
            maximizeIcon: defaultMaximizeIcon
        };

        /**
         * Various self-explanatory flags.
         * Could have used a bitmask here but this is probably better for a language like js.
         * @package
         */
        this.cursorOnTitlebar =
        this.cursorOnTitlebarButtons =
        this.cursorOnWindow =
        this.isMinimized =
        this.isMaximized = false;

        /**
         * If the mouse is hovering over any of the titlebar buttons, this property
         * takes values from the titlebarButtons object.
         * The default value is NO_VALUE which means that the mouse isn't on top of any buttons.
         * @package
         */
        this.hoverTitlebarButton = NO_VALUE;

        /**
         * If the tooltip is visible over any of the titlebar buttons, this property
         * takes values from the titlebarButtons object.
         * The default value is NO_VALUE which means that the tooltip isn't visible on
         * any of the titlebar buttons.
         * @package
         */
        this.tooltipOnTitlebarButton = NO_VALUE;

        /**
         * True if the tooltip is visible on the window title.
         * False otherwise.
         * If (this.tooltipOnTitlebarButton === NO_VALUE) && !this.tooltipOnTitle
         * then the tooltip isn't visible.
         * @package
         */
        this.tooltipOnTitle = false;

        /**
         * When the user clicks maximize and then restore, they expect the dialog
         * to be in the same position and of the same size it was before it got
         * maximized. This property is used as a cache for the previous dimensions
         * of the dialog.
         * @private
         */
        this.rcCache = {
            width: 0,
            height: 0,
            top: 0,
            left: 0,
        };

        /**
         * Points to the span element that surrounds the dialog's title.
         * @private
         */
        this.titleRef = React.createRef();
    }

    componentDidMount() {
        //the dialog object gets registered to the window manager
        //after it's been initialized and mounted
        Win32Dialog.windowManager.registerWindow(this);
    }

    componentWillUnmount() {
        //unregister the dialog from the window manager, if it hasn't
        //been closed through the X button
        if (!this.state.hasClosed) {
            Win32Dialog.windowManager.unregisterWindow(this.state.zIndex);
        }
    }

    componentDidUpdate() {
        /*
          If the tooltipRef property isn't undefined, it means that
          the Tooltip was rendered and we have to check if it's
          drawn outside of the viewport's rightmost side. The behavior
          that the tooltips on Windows dialog boxes exhibit in this case,
          is to move the tooltip as much as possible to the left, so
          that the entire box is visible.

          This:

                        |\      |
                        | \     |
                        |  \    |
                        |   \   |
                        |_  _\  |
                         _\_\___|
                        |       |
                        |   T o |
                        |_______|

          Becomes this:

                        |\      |
                        | \     |
                        |  \    |
                        |   \   |
                        |_  _\  |
             _____________\_\___|
            |                   |
            |   T o o l t i p   |
            |___________________|
        */
        if (this.tooltipRef) {
            this._deselectTooltipText();

            const tooltipRect = this.tooltipRef.getBoundingClientRect();
            const viewportWidth = getViewportWidth();

            if (tooltipRect.right > viewportWidth) {
                this.setState((prevState) => {
                    let diff = tooltipRect.right - viewportWidth;

                    return {
                        tooltipArgs: {
                            ...prevState.tooltipArgs,
                            position: {
                                x: prevState.tooltipArgs.position.x - diff,
                                y: prevState.tooltipArgs.position.y
                            },
                        }
                    };
                });
            }
        }
    }

    /**
     * This method uses the Selection API to programmatically deselect
     * the text displayed by a tooltip. There are some cases where the tooltip
     * text can get accidentally selected (for example if the user selects a
     * bunch of elements in the page that are above the tooltip), and this
     * isn't good because you can't select the text from Windows dialog tooltip
     * boxes.
     * This method should only be called from within componentDidUpdate because
     * it accesses the state directly.
     * Note that it doesn't work perfectly. In some cases it might deselect text
     * outside of the tooltip.
     * @private
     */
    _deselectTooltipText() {
        if (typeof window.getSelection === 'function') {
            const sel = window.getSelection();

            if (sel.containsNode(this.tooltipRef, false)) {

                const tooltipMsg = this.state.tooltipArgs.msg;
                let range, rangeText;

                for (let i = 0; i < sel.rangeCount; i++) {
                    range = sel.getRangeAt(i);
                    rangeText = range.toString();

                    if (rangeText.includes(tooltipMsg)) {
                        sel.removeRange(range);
                        break;
                    }
                }
            }
        }
    }

    /**
     * Resizes the window.
     * @param {module:cursor/CursorPos} cursor_pos
     * @param {number} resize_type Value from the
     * {module:cursor/cursorState} object.
     * @package
     */
    updateWindowSize(cursor_pos, resize_type) {
        this.rc.resizeToCursor(cursor_pos, resize_type);

        this.setState({
            width: this.rc.width,
            height: this.rc.height,
            top: this.rc.top,
            left: this.rc.left,
        });
    }

    /**
     * Moves the window.
     * @param {module:cursor/CursorPos} cursor_pos
     * @package
     */
    updateWindowPosition(cursor_pos) {
        this.rc.moveToCursor(cursor_pos);

        this.setState({
            top: this.rc.top,
            left: this.rc.left,
        });
    }

    /**
     * @param {boolean} new_focus True if the window has mouse focus,
     * false otherwise.
     * @package
     */
    updateWindowFocus(new_focus) {
        this.setState((prevState) => {
            if (prevState.hasFocus != new_focus) {
                if (new_focus) {
                    this.props.onFocus && this.props.onFocus();
                } else {
                    this.props.onBlur && this.props.onBlur();
                }

                return {
                    hasFocus: new_focus
                };
            }
        });
    }

    /**
     * @param {number} new_zindex The new z-index property of the window.
     * @package
     */
    updateWindowZIndex(new_zindex) {
        this.setState({
            zIndex: new_zindex
        });
    }

    /**
     * Should be called by the window manager, right
     * before the window starts moving/resizing (when the user clicks on the
     * titlebar/border, but before they drag the mouse).
     * @param {module:cursor/CursorPos} cursor_pos
     * @param {module:cursor/cursorState} resize_type
     * @package
     */
    setupCursorOffset(cursor_pos, resize_type) {
        this.rc.setCursorOffset(cursor_pos, resize_type);
    }

    /**
     * Should be called by the window manager, after
     * the window stops moving (when the user releases the mouse).
     * @package
     */
    fixOffScreenMove() {
        this.rc.moveWithinViewport();
        this.setState({
            top: this.rc.top,
            left: this.rc.left,
        });
    }

    /**
     * Checks whether the cursor is on top of the dialog's border or not.
     * @param {module:cursor/CursorPos} cursor_pos
     * @package
     */
    getCursorState(cursor_pos) {
        return this.rc.getCursorResizeState(cursor_pos);
    }

    /**
     * Shows the tooltip of the button that's underneath the cursor.
     * @param {module:cursor/CursorPos} cursor_pos The tooltip will
     * appear right underneath the cursor's position
     * @param {number} zIndex The tooltip's z-index.
     * @package
     */
    showTooltip(cursor_pos, zIndex) {
        let validTooltip = false;

        if (this.cursorOnTitlebarButtons) {
            let idx = this.hoverTitlebarButton;

            this.tooltipOnTitlebarButton = this.hoverTitlebarButton;
            this.tooltipOnTitle = false;

            if (this.isMaximized && this.hoverTitlebarButton === titlebarButtons.maximize) {
                //if the window is maximized, and the mouse is hovering on the maximize button,
                //then the text on the tooltip should be 'Restore Down'
                idx = Win32Dialog.tooltipMessages.length - 1;
            }

            this.setState({
                tooltipArgs: {
                    msg: Win32Dialog.tooltipMessages[idx],
                    position: cursor_pos,
                    zIndex: zIndex
                }
            });

            validTooltip = true;
        } else if (this.isTitleOverflowing()) {
            this.tooltipOnTitlebarButton = NO_VALUE;
            this.tooltipOnTitle = true;
            this.setState({
                tooltipArgs: {
                    msg: this.props.title,
                    position: cursor_pos,
                    zIndex: zIndex
                }
            });

            validTooltip = true;
        }

        return validTooltip;
    }

    /**
     * Closes the dialog's open tooltip (if it's open).
     * @package
     */
    closeTooltip() {
        this.setState((prevState) => {
            if (prevState.tooltipArgs.position) {
                this.tooltipOnTitlebarButton = NO_VALUE;
                this.tooltipOnTitle = false;
                return {
                    tooltipArgs: {
                        msg: '',
                        position: null,
                    }
                };
            }
            return null;
        });
    }

    /**
     * Returns true if the dialog title is longer than the
     * titlebar's width and is truncated:
     * ┌──────────────────┐
     * │ React Win32 d... │
     * ├──────────────────┤
     * │                  │
     * │                  │
     * 
     * False otherwise:
     * ┌────────────────────────────┐
     * │ React Win32 dialog box     │
     * ├────────────────────────────┤
     * │                            │
     * │                            │
     * @package
     */
    isTitleOverflowing() {
        if (this.titleRef) {
            if (this.titleRef.current.scrollWidth > this.titleRef.current.clientWidth)
                return true;
        }

        return false;
    }

    /**
     * Pushes the titlebar button that has the mouse on top of it.
     * Doesn't call the button's handler, just changes its style.
     * @package
     */
    pushTitlebarButton() {
        if (this.cursorOnTitlebarButtons) {
            if (this.hoverTitlebarButton === NO_VALUE) {
                this.hoverTitlebarButton = titlebarButtons.maximize;
            }

            this.setState({
                activeTitlebarButton: this.hoverTitlebarButton
            });
        }

        return this.hoverTitlebarButton;
    }

    /**
     * Releases the currently pushed titlebar button.
     * @package
     */
    releaseTitlebarButton() {
        this.setState((prevState) => {
            if (prevState.activeTitlebarButton !== NO_VALUE) {
                return {
                    activeTitlebarButton: NO_VALUE
                };
            }
            return null;
        });
    }

    /**
     * Maximizes the window. Only called by the window manager.
     * @package
     */
    maximize() {
        this.rc.coverDocumentBody();
        this.setState({
            width: this.rc.width,
            height: this.rc.height,
            top: this.rc.top,
            left: this.rc.left,
        });
    }

    /**
     * Handlers for each titlebar button.
     * @param {number} button Legal values are the values from the
     * titlebarButtons object.
     * @package
     */
    handleTitlebarButtonClick(button) {
        let icon, noBorder;

        switch (button) {
        case titlebarButtons.minimize:
            if (this.isMaximized) {
                break;
            }

            this.isMinimized = !this.isMinimized;

            this.rc.setCursorOffset();

            if (this.isMinimized) {
                this.rcCache.width = this.rc.width;
                this.rcCache.height = this.rc.height;
        
                this.rc.resizeToCursor({
                    x: this.rc.left + this.rc.minWidth,
                    y: this.rc.top + this.rc.minHeight
                }, cursorState.bottomright);
            } else {
                this.rc.resizeToCursor({
                    x: this.rc.left + this.rcCache.width,
                    y: this.rc.top + this.rcCache.height
                }, cursorState.bottomright);
            }

            this.setState({
                width: this.rc.width,
                height: this.rc.height,
            });
            break;
        case titlebarButtons.maximize:
            if (this.isMinimized) {
                break;
            }

            this.isMaximized = !this.isMaximized;
            noBorder = this.isMaximized;

            if (this.isMaximized) {
                this.rcCache.width = this.rc.width;
                this.rcCache.height = this.rc.height;
                this.rcCache.top = this.rc.top;
                this.rcCache.left = this.rc.left;
        
                this.rc.coverDocumentBody();
                icon = defaultRestoreIcon;
            } else {
                this.rc.setCursorOffset();

                this.rc.update(this.rcCache.left,
                               this.rcCache.top,
                               this.rcCache.width,
                               this.rcCache.height);
                icon = defaultMaximizeIcon;
            }

            this.setState({
                width: this.rc.width,
                height: this.rc.height,
                top: this.rc.top,
                left: this.rc.left,
                noBorder: noBorder,
                maximizeIcon: icon
            });
            break;
        case titlebarButtons.close:
            //If an onExit callback was given as a prop, call it.
            //If the callback's return value is truthy, then this
            //dialog box is "destroyed" (essentially it will only
            //render null from now on) and it will be unregistered
            //from the window manager.
            //If an onExit callback wasn't given, then the window
            //simply gets destroyed and unregistered.
            //If a callback was given and it returns falsy, nothing happens.
            if (!this.props.onExit || this.props.onExit()) {
                Win32Dialog.windowManager.unregisterWindow(this.state.zIndex);
                this.setState({
                    hasClosed: true
                });
            }
            break;
        }
    }

    render() {
        if (this.state.hasClosed) {
            return null;
        }

        const {
            maximizeIcon,
            tooltipArgs,
            activeTitlebarButton,
            hasFocus,
            noBorder,
            ...borderStyle
        } = this.state;

        let borderClasses = 'react-win32dialog-outer-border',
            titlebarClasses = 'react-win32dialog-titlebar';

        if (hasFocus) {
            borderClasses += ' react-win32dialog-outer-border-focused';
            titlebarClasses += ' react-win32dialog-titlebar-focused';
        }

        if (noBorder) {
            borderClasses += ' react-win32dialog-maximized';
            titlebarClasses += ' react-win32dialog-maximized';
        }

        let toggledButtons = [ false, false, false ];

        if (activeTitlebarButton !== NO_VALUE)
            toggledButtons[activeTitlebarButton] = true;

        return (
            <React.Fragment>

            <Tooltip
                args={tooltipArgs}
                getRef={el => this.tooltipRef = el}
            />

            <div
                style={borderStyle}
                onMouseEnter={() => this.cursorOnWindow = true}
                onMouseLeave={() => this.cursorOnWindow = false}
                className={borderClasses}
            >

                <div
                    onMouseEnter={() => this.cursorOnTitlebar = true}
                    onMouseLeave={() => this.cursorOnTitlebar = false}
                    className={titlebarClasses}
                >
                    <img
                        src={this.props.icon}
                        draggable={false}
                        width='13'
                        height='13'
                        className='react-win32dialog-titlebar-icon'
                    />

                    <span ref={this.titleRef}>{this.props.title}</span>

                    <div
                        className='react-win32dialog-titlebar-buttons'
                        onMouseEnter={() => this.cursorOnTitlebarButtons = true}
                        onMouseLeave={() => this.cursorOnTitlebarButtons = false}
                    >
                        <TitlebarButton
                            icon={defaultMinimizeIcon}
                            onEnter={() => this.hoverTitlebarButton = titlebarButtons.minimize}
                            onLeave={() => this.hoverTitlebarButton = NO_VALUE}
                            toggled={toggledButtons[titlebarButtons.minimize]}
                        />
                        <TitlebarButton
                            icon={maximizeIcon}
                            onEnter={() => this.hoverTitlebarButton = titlebarButtons.maximize}
                            onLeave={() => this.hoverTitlebarButton = NO_VALUE}
                            toggled={toggledButtons[titlebarButtons.maximize]}
                        />
                        <TitlebarButton
                            icon={defaultCloseIcon}
                            onEnter={() => this.hoverTitlebarButton = titlebarButtons.close}
                            onLeave={() => this.hoverTitlebarButton = NO_VALUE}
                            toggled={toggledButtons[titlebarButtons.close]}
                        />
                    </div>
                </div>

                {this.props.children}
            </div>

            </React.Fragment>
        );
    }
}

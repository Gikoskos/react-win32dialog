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
import { NO_VALUE } from './globals';


import defaultTitlebarIcon from './assets/default-titlebar-icon.png';
import defaultCloseIcon from './assets/default-close-icon.png';
import defaultMinimizeIcon from './assets/default-minimize-icon.png';
import defaultMaximizeIcon from './assets/default-maximize-icon.png';
import defaultRestoreIcon from './assets/default-restore-icon.png';
 

//Initialize the window manager. Only one instance
//of the window manager should be running at any given point.
const windowManager = new WindowManager();


/**
 * Represents a Win32Dialog dialog box as a React component.
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
         * Minimum width that the dialog can have.
         * @see {module:rect} for the default value.
         */
        minWidth: PropTypes.number,
        /**
         * Minimum height that the dialog can have.
         * @see {module:rect} for the default value.
         */
        minHeight: PropTypes.number,
        /**
         * Maximum width that the dialog can have.
         * @see {module:rect} for the default value.
         */
        maxWidth: PropTypes.number,
        /**
         * Maximum height that the dialog can have.
         * @see {module:rect} for the default value.
         */
        maxHeight: PropTypes.number,
        /**
         * Width of the dialog's outer border.
         * @see {module:rect} for the default value.
         */
        borderWidth: PropTypes.number,
        /** Text that is displayed on the dialog's titlebar. */
        title: PropTypes.string,
        /** Icon that is displayed on the dialog's titlebar. */
        icon: PropTypes.string,
        /** Is called when the dialog's X button is pressed. */
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
                                 this.props.minWidth,
                                 this.props.minHeight,
                                 this.props.maxWidth,
                                 this.props.maxHeight,
                                 this.props.borderWidth);

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
             * @private
             */
            noBorder: false,

            /**
             * Is true only when the dialog has mouse focus.
             * @private
             */
            hasFocus: false,

            /**
             * If any of the titlebar buttons is pushed, this property
             * takes values from the titlebarButtons object.
             * The default value is NO_VALUE which means that no buttons are pushed.
             * @private
             */
            activeTitlebarButton: NO_VALUE,

            tooltipArgs: {
                /**
                 * The text that is displayed in the tooltip.
                 * @private
                 */
                msg: '',
                /**
                 * The tooltip needs to know the cursor's position
                 * since it is displayed right underneath it.
                 * This also serves as a flag because when it's null,
                 * the tooltip isn't displayed.
                 * @private
                 */
                position: null,
            },

            /**
             * The maximize icon changes if the window is maximized
             * so we keep it in the object's state.
             * @private
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
         * The default value is NO_VALUE which means that the tooltip isn't visible.
         * @package
         */
        this.tooltipTitlebarButton = NO_VALUE;

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

        this.titleRef = React.createRef();
        
    }

    componentDidMount() {
        //the dialog object gets registered to the window manager
        //after it's been initialized and mounted
        windowManager.registerWindow(this);
    }

    componentWillUnmount() {
        windowManager.unregisterWindow(this.state.zIndex);
    }

    componentDidUpdate() {
        /*
          If the tooltipRef property isn't undefined, it means that
          the Tooltip was rendered and we have to check if it's
          drawn outside of the viewport's rightmost side. Windows'
          behavior in this case, is to move the tooltip as much as
          possible to the left, so that the entire box is visible.

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

            if (tooltipRect.right > window.innerWidth) {
                this.setState((prevState) => {
                    const diff = tooltipRect.right - window.innerWidth;

                    return {
                        tooltipArgs: {
                            msg: prevState.tooltipArgs.msg,
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
     * Caches the dialog's current dimensions.
     * @private
     */
    _cacheDialogRect = () => {
        this.rcCache.width = this.rc.width;
        this.rcCache.height = this.rc.height;
        this.rcCache.top = this.rc.top - window.scrollY;
        this.rcCache.left = this.rc.left - window.scrollX;
    }

    /**
     * Maximizes/restores the window after double clicking the titlebar.
     * @private
     */
    _onTitlebarDoubleClick = () => {
        if (!this.cursorOnTitlebarButtons) {
            this.handleTitlebarButtonClick(titlebarButtons.maximize);
        }
    }

    /**
     * This method uses the new Selection API to programmatically deselect
     * the text displayed by a tooltip. There are some cases where the tooltip
     * text will be selected, and this isn't good because you can't select
     * the text from Windows dialog tooltip boxes.
     * Calling this method from within componentDidUpdate ensures that the
     * text gets deselected.
     * @private
     */
    _deselectTooltipText = () => {
        if (typeof window.getSelection === 'function') {
            const sel = window.getSelection();
            const tooltipMsg = this.state.tooltipArgs.msg;
            let range, rangeText;

            if (sel.containsNode(this.tooltipRef, false)) {
                for(let i = 0; i < sel.rangeCount; i++) {
                    range = sel.getRangeAt(i);
                    rangeText = range.toString();

                    if (tooltipMsg.includes(rangeText) || rangeText.includes(tooltipMsg)) {
                        sel.removeRange(range);
                        break;
                    }
                }
            }
        }
    }

    /**
     * Resizes the window
     * @param {number} resize_type Value from the
     * {module:./cursor.js/cursorState} object.
     * @param {module:cursor/CursorPos} cursor_pos
     * @package
     */
    updateWindowSize = (resize_type, cursor_pos) => {
        this.rc.resizeToCursor(resize_type, cursor_pos);

        this.setState({
            width: this.rc.width,
            height: this.rc.height,
            top: this.rc.top,
            left: this.rc.left,
        });
    }

    /**
     * Moves the window
     * @param {module:cursor/CursorPos} cursor_pos
     * @package
     */
    updateWindowPosition = (cursor_pos) => {
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
    updateWindowFocus = (new_focus) => {
        if (new_focus) {
            if (this.props.onFocus) this.props.onFocus();
        } else {
            if (this.props.onBlur) this.props.onBlur();
        }

        this.setState({
            hasFocus: new_focus
        });
    }

    /**
     * @param {number} new_zindex The new z-index property of the window.
     * @package
     */
    updateWindowZIndex = (new_zindex) => {
        this.setState({
            zIndex: new_zindex
        });
    }

    /**
     * Should be called by the window manager, right
     * before the window starts moving (when the user clicks on the
     * titlebar, but before they drag the mouse).
     * @param {module:cursor/CursorPos} cursor_pos
     * @package
     */
    moveBegin = (cursor_pos) => {
        this.rc.setCursorOffset(cursor_pos);
    }

    /**
     * Should be called by the window manager, after
     * the window stops moving (when the user releases the mouse).
     * @package
     */
    moveEnd = () => {
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
    getCursorState = (cursor_pos) => {
        return this.rc.getCursorResizeState(cursor_pos);
    }

    /**
     * Shows the tooltip of the button that's underneath the cursor.
     * @param {module:cursor/CursorPos} cursor_pos The tooltip will
     * appear right underneath the cursor's position
     * @package
     */
    showTooltip = (cursor_pos) => {
        let res = false;

        if (this.hoverTitlebarButton !== NO_VALUE) {
            let idx = this.hoverTitlebarButton;

            this.tooltipTitlebarButton = this.hoverTitlebarButton;

            if (this.isMaximized && this.hoverTitlebarButton === titlebarButtons.maximize) {
                //if the window is maximized, and the mouse is hovering on the maximize button,
                //then the text on the tooltip should be 'Restore Down'
                idx = 3;
            }

            this.setState({
                tooltipArgs: {
                    msg: Win32Dialog.tooltipMessages[idx],
                    position: cursor_pos,
                }
            });

            res = true;
        } else if (!this.cursorOnTitlebarButtons && this.isTitleOverflowing()) {
            this.setState({
                tooltipArgs: {
                    msg: this.props.title,
                    position: cursor_pos,
                }
            });

            res = true;
        }

        return res;
    }

    /**
     * Closes the dialog's open tooltip (if it's open).
     * @package
     */
    closeTooltip = () => {
        this.setState((prevState) => {
            if (prevState.tooltipArgs.position) {
                this.tooltipTitlebarButton = NO_VALUE;
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
    isTitleOverflowing = () => {
        if (this.titleRef) {
            if (this.titleRef.current.scrollWidth > this.titleRef.current.clientWidth)
                return true;
        }

        return false;
    }

    /**
     * Pushes the titlebar button that has the mouse on top of it.
     * @package
     */
    pushTitlebarButton = () => {
        if (this.hoverTitlebarButton !== NO_VALUE) {
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
    releaseTitlebarButton = () => {
        this.setState((prevState, props) => {
            if (prevState.activeTitlebarButton !== NO_VALUE) {
                return {
                    activeTitlebarButton: NO_VALUE
                };
            }
            return null;
        });
    }

    /**
     * @param {number} button Legal values are the values from the
     * titlebarButtons object.
     * @package
     */
    handleTitlebarButtonClick = (button) => {
        let icon, noBorder;

        switch (button) {
        case titlebarButtons.minimize:
            if (this.isMaximized) {
                break;
            }

            this.isMinimized = !this.isMinimized;

            if (this.isMinimized) {
                this._cacheDialogRect();

                this.rc.resizeToCursor(cursorState.bottomright, {
                    x: this.rc.left + this.rc.minWidth,
                    y: this.rc.top + this.rc.minHeight
                });
            } else {
                this.rc.resizeToCursor(cursorState.bottomright, {
                    x: this.rc.left + this.rcCache.width,
                    y: this.rc.top + this.rcCache.height
                });
            }

            this.setState({
                width: this.rc.width,
                height: this.rc.height,
                top: this.rc.top,
                left: this.rc.left,
            });
            break;
        case titlebarButtons.maximize:
            if (this.isMinimized) {
                break;
            }

            this.isMaximized = !this.isMaximized;

            if (this.isMaximized) {
                this._cacheDialogRect();

                this.rc.resizeToCursor(cursorState.topleft, {
                    x: 1,
                    y: 1
                });
                this.rc.resizeToCursor(cursorState.bottomright, {
                    x: window.innerWidth - 1,
                    y: window.innerHeight - 1
                });

                noBorder = true;
                icon = defaultRestoreIcon;
            } else {

                this.rc.resizeToCursor(cursorState.topleft, {
                    x: this.rcCache.left,
                    y: this.rcCache.top
                });
                this.rc.resizeToCursor(cursorState.bottomright, {
                    x: this.rcCache.left + this.rcCache.width,
                    y: this.rcCache.top + this.rcCache.height
                });

                noBorder = false;
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
            if (this.props.onExit) {
                this.props.onExit();
            }
            break;
        }
    }

    render() {
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
                position={tooltipArgs.position}
                msg={tooltipArgs.msg}
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
                    onContextMenu={(ev) => ev.preventDefault()}
                >
                    <img
                        src={this.props.icon}
                        draggable={false}
                        onMouseDown={(ev) => ev.preventDefault()}
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

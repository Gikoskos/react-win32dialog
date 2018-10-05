'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import DialogRect from './rect';
import WindowManager from './manager';
import Tooltip from './tooltip.js';
import { cursorState }  from './cursor.js';
import {
    titlebarButtons,
    TitlebarButton,
} from './titlebarbutton.js';

import styles from './styles.scss';
import defaultTitlebarIcon from './assets/default-titlebar-icon.png';
import defaultCloseIcon from './assets/default-close-icon.png';
import defaultMinimizeIcon from './assets/default-minimize-icon.png';
import defaultMaximizeIcon from './assets/default-maximize-icon.png';
import defaultRestoreIcon from './assets/default-restore-icon.png';
 


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
         * @see {@link ./rect.js} for the default value.
         */
        minWidth: PropTypes.number,
        /**
         * Minimum height that the dialog can have.
         * @see {@link ./rect.js} for the default value.
         */
        minHeight: PropTypes.number,
        /**
         * Maximum width that the dialog can have.
         * @see {@link ./rect.js} for the default value.
         */
        maxWidth: PropTypes.number,
        /**
         * Maximum height that the dialog can have.
         * @see {@link ./rect.js} for the default value.
         */
        maxHeight: PropTypes.number,
        /**
         * Width of the dialog's outer border.
         * @see {@link ./rect.js} for the default value.
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
            borderWidth: this.rc.borderWidth,
            width: this.rc.width,
            height: this.rc.height,
            top: this.rc.top,
            left: this.rc.left,
            zIndex: 0,
            //CSS state end


            /**
             * Is true only when the dialog has mouse focus.
             * @private
             */
            hasFocus: false,

            /**
             * If any of the titlebar buttons is pushed, this property
             * takes values from the titlebarButtons object.
             * The default value is -1 which means that no buttons are pushed.
             * @private
             */
            activeTitlebarButton: -1,

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
         * @protected
         */
        this.cursorOnTitlebar =
        this.cursorOnTitlebarButtons =
        this.cursorOnWindow =
        this.isMinimized =
        this.isMaximized = false;

        /**
         * If the mouse is hovering over any of the titlebar buttons, this property
         * takes values from the titlebarButtons object.
         * The default value is -1 which means that the mouse isn't on top of any buttons.
         * @protected
         */
        this.hoverTitlebarButton = -1;

        /**
         * If the tooltip is visible over any of the titlebar buttons, this property
         * takes values from the titlebarButtons object.
         * The default value is -1 which means that the tooltip isn't visible.
         * @protected
         */
        this.tooltipTitlebarButton = -1;

        /**
         * When the user clicks maximize and then restore, they expect the dialog
         * to be in the same position and of the same size it was before it got
         * maximized. This property caches the previous dimensions of the dialog.
         * @private
         */
        this.oldRect = {
            width: 0,
            height: 0,
            top: 0,
            left: 0,
        };
    }

    componentDidMount() {
        windowManager.registerWindow(this);
    }

    componentWillUnmount() {
        windowManager.unregisterWindow(this.state.zIndex);
    }

    componentDidUpdate() {
        if (this.tooltipRef) {
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
     * Resizes the window if it's not maximized
     * @private
     */
    _onTitlebarDoubleClick = () => {
        if (!this.cursorOnTitlebarButtons) {
            this.handleTitlebarButtonClick(titlebarButtons.maximize);
        }
    }

    /**
     * Resizes the window if it's not maximized or minimized
     * @param {number} resize_type Value from the
     * {@link ./cursor.js:resizeState} object.
     * @param {number} cursor_pos.x Cursor's x position relative to
     * the web page.
     * @param {number} cursor_pos.y Cursor's y position relative to
     * the web page.
     * @protected
     */
    updateWindowSize = (resize_type, cursor_pos) => {
        if (!this.isMaximized && !this.isMinimized) {
            this.rc.resizeToCursor(resize_type, cursor_pos);

            this.setState({
                width: this.rc.width,
                height: this.rc.height,
                top: this.rc.top,
                left: this.rc.left,
            });
        }
    }

    /**
     * Moves the window if it's not maximized
     * @param {number} cursor_pos.x Cursor's x position relative to
     * the web page.
     * @param {number} cursor_pos.y Cursor's y position relative to
     * the web page.
     * @protected
     */
    updateWindowPosition = (cursor_pos) => {
        if (!this.isMaximized) {
            this.rc.moveToCursor(cursor_pos);

            this.setState({
                top: this.rc.top,
                left: this.rc.left,
            });
        }
    }

    /**
     * @param {boolean} new_focus True if the window has mouse focus,
     * false otherwise.
     * @protected
     */
    updateWindowFocus = (new_focus) => {
        this.setState({
            hasFocus: new_focus
        });
    }

    /**
     * Update the dialog's z-index CSS property.
     * @param {number} new_zindex The new z-index property of the window.
     * @protected
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
     * @param {number} cursor_pos.x Cursor's x position relative to
     * the web page.
     * @param {number} cursor_pos.y Cursor's y position relative to
     * the web page.
     * @protected
     */
    moveBegin = (cursor_pos) => {
        this.rc.setCursorOffset(cursor_pos);
    }

    /**
     * Should be called by the window manager, after
     * the window stops moving (when the user releases the mouse).
     * @protected
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
     * @param {number} cursor_pos.x Cursor's x position relative to
     * the web page.
     * @param {number} cursor_pos.y Cursor's y position relative to
     * the web page.
     * @protected
     */
    getCursorState = (cursor_pos) => {
        return this.rc.getCursorResizeState(cursor_pos);
    }

    /**
     * Shows the tooltip of the button that's underneath the cursor.
     * @param {number} cursor_pos.x Cursor's x position relative to
     * the web page.
     * @param {number} cursor_pos.y Cursor's y position relative to
     * the web page.
     * @protected
     */
    showTooltip = (cursor_pos) => {
        if (this.hoverTitlebarButton !== -1) {
            const tooltipMessages = ['Minimize', 'Maximize', 'Close'];

            this.tooltipTitlebarButton = this.hoverTitlebarButton;

            this.setState({
                tooltipArgs: {
                    msg: tooltipMessages[this.hoverTitlebarButton],
                    position: cursor_pos,
                }
            });
        }
    }

    /**
     * Closes the dialog's open tooltip (if it's open).
     * @protected
     */
    closeTooltip = () => {
        this.setState((prevState, props) => {
            if (prevState.tooltipArgs.position) {
                this.tooltipTitlebarButton = -1;
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
     * Pushes the titlebar button that has the mouse on top of it.
     * @protected
     */
    pushTitlebarButton = () => {
        if (this.hoverTitlebarButton !== -1) {
            this.setState({
                activeTitlebarButton: this.hoverTitlebarButton
            });
        }

        return this.hoverTitlebarButton;
    }

    /**
     * Releases the currently pushed titlebar button.
     * @protected
     */
    releaseTitlebarButton = () => {
        this.setState((prevState, props) => {
            if (prevState.activeTitlebarButton !== -1) {
                return {
                    activeTitlebarButton: -1
                };
            }
            return null;
        });
    }

    /**
     * Handles the actions that happen after clicking a titlebar button.
     * @param {number} button Legal values are the values from the
     * titlebarButtons object.
     * @protected
     */
    handleTitlebarButtonClick = (button) => {
        let icon;

        switch (button) {
        case titlebarButtons.minimize:
            if (this.isMaximized) {
                break;
            }

            this.isMinimized = !this.isMinimized;

            if (this.isMinimized) {
                this.oldRect.width = this.rc.width;
                this.oldRect.height = this.rc.height;

                this.rc.resizeToCursor(cursorState.bottomright, {
                    x: this.rc.left + this.rc.minWidth,
                    y: this.rc.top + this.rc.minHeight
                });
            } else {
                this.rc.resizeToCursor(cursorState.bottomright, {
                    x: this.rc.left + this.oldRect.width,
                    y: this.rc.top + this.oldRect.height
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

                this.oldRect.width = this.rc.width;
                this.oldRect.height = this.rc.height;
                this.oldRect.top = this.rc.top - window.scrollY;
                this.oldRect.left = this.rc.left - window.scrollX;


                this.rc.resizeToCursor(cursorState.topleft, {
                    x: 1,
                    y: 1
                });
                this.rc.resizeToCursor(cursorState.bottomright, {
                    x: window.innerWidth - 1,
                    y: window.innerHeight - 1
                });

                icon = defaultRestoreIcon;
            } else {

                this.rc.resizeToCursor(cursorState.topleft, {
                    x: this.oldRect.left,
                    y: this.oldRect.top
                });
                this.rc.resizeToCursor(cursorState.bottomright, {
                    x: this.oldRect.left + this.oldRect.width,
                    y: this.oldRect.top + this.oldRect.height
                });

                icon = defaultMaximizeIcon;
            }

            this.setState({
                width: this.rc.width,
                height: this.rc.height,
                top: this.rc.top,
                left: this.rc.left,
                maximizeIcon: icon
            });
            break;
        case titlebarButtons.close:
            alert("Close not implemented yet :)");
            break;
        }
    }

    render() {
        const {
            maximizeIcon,
            tooltipArgs,
            activeTitlebarButton,
            hasFocus,
            ...borderStyle
        } = this.state;

        let borderClasses = 'react-win32dialog-outer-border',
            titlebarClasses = 'react-win32dialog-titlebar';

        if (hasFocus) {
            borderClasses += ' react-win32dialog-outer-border-focused';
            titlebarClasses += ' react-win32dialog-titlebar-focused';
        }

        let toggledButtons = [ false, false, false ];

        if (activeTitlebarButton !== -1)
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
                    onDoubleClick={this._onTitlebarDoubleClick}
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

                    <span>{this.props.title}</span>

                    <div
                        className='react-win32dialog-titlebar-buttons'
                        onMouseEnter={() => this.cursorOnTitlebarButtons = true}
                        onMouseLeave={() => this.cursorOnTitlebarButtons = false}
                    >
                        <TitlebarButton
                            icon={defaultMinimizeIcon}
                            onEnter={() => this.hoverTitlebarButton = titlebarButtons.minimize}
                            onLeave={() => this.hoverTitlebarButton = -1}
                            toggled={toggledButtons[titlebarButtons.minimize]}
                        />
                        <TitlebarButton
                            icon={maximizeIcon}
                            onEnter={() => this.hoverTitlebarButton = titlebarButtons.maximize}
                            onLeave={() => this.hoverTitlebarButton = -1}
                            toggled={toggledButtons[titlebarButtons.maximize]}
                        />
                        <TitlebarButton
                            icon={defaultCloseIcon}
                            onEnter={() => this.hoverTitlebarButton = titlebarButtons.close}
                            onLeave={() => this.hoverTitlebarButton = -1}
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

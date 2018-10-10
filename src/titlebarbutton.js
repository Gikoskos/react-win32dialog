/**
 * @module titlebarbutton
 */
'use strict';

import React from 'react';

/**
 * Object that enumerates all titlebar buttons.
 * @package
 */
const titlebarButtons = {
    minimize: 0,
    maximize: 1,
    close: 2,
};

/**
 * Represents a titlebar button as a React component.
 * @package
 */
const TitlebarButton = (props) => {
    const buttonClasses = (props.toggled) ?
        'react-win32dialog-titlebar-button react-win32dialog-titlebar-button-active' :
        'react-win32dialog-titlebar-button';

    return (
        <div
            onMouseEnter={props.onEnter}
            onMouseLeave={props.onLeave}
            className={buttonClasses}
        >
            <img
                src={props.icon}
                draggable={false}
                onMouseDown={(ev) => ev.preventDefault()}
                width='13'
                height='11'
            />
        </div>
    );
};

export {
    titlebarButtons,
    TitlebarButton,
};

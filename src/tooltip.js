'use strict';

import React from 'react';



/**
 * The tooltip appears right underneath the mouse pointer, so its position in the y axis
 * is the same as the pointer's if you add the cursor's height.
 *  |\
 *  | \
 *  |  \
 *  |   \
 *  |_  _\
 *   _\_\_______________
 *  |                   |
 *  |   T o o l t i p   |
 *  |___________________|
 *
 *
 * Note: I think there's no way to get the desktop's cursor icon size (height, width)
 * in JS so I'm hardcoding the height of the default Windows 7 cursor. If a different
 * cursor icon is used, the tooltip might not appear exactly underneath the cursor.
 */
const cursorHeight = 18;


/**
 * Represents a tooltip as a React component.
 */
const Tooltip = (props) => {
    if (props.position) {

        return (
            <div
                className='react-win32dialog-tooltip'
                style={{
                    left: props.position.x,
                    top: props.position.y + cursorHeight,
                }}
                ref={props.getRef}
            >
                {props.msg}
            </div>
        );
    } else {
        return null;
    }
};

export default Tooltip;
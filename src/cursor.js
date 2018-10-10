/**
 * @module cursor
 */
'use strict';

/**
 * Object that enumerates all possible cursor resize states.
 * @package
 */
const cursorState = {
    regular: 0,
    bottom: 1,
    bottomright: 2,
    bottomleft: 3,
    top: 4,
    topright: 5,
    topleft: 6,
    right: 7,
    left: 8
};

/**
 * Array with the CSS properties for each possible cursor resize
 * state. It should be indexed with values from the cursorState object.
 * @package
 */
const cursorStyle = [
    "default",
    "s-resize",
    "se-resize",
    "sw-resize",
    "n-resize",
    "ne-resize",
    "nw-resize",
    "e-resize",
    "w-resize",
];

/**
 * @package
 */
const cursorStyleClasses = cursorStyle.map(i => 'react-win32dialog-cursor-' + i)

/**
 * @typedef {Object} CursorPos
 * @property {number} x Cursor's x position relative to
 * the web page.
 * @property {number} y Cursor's y position relative to
 * the web page.
 * @package
 */

/**
 * Returns a CursorPos object with the cursor's position
 * relative to the viewport's scroll.
 * @param {Event} ev
 * @package
 */
const getCursorPos = (ev) => ({
    x: ev.clientX + window.scrollX,
    y: ev.clientY + window.scrollY,
});

/**
 * Sets the document's body cursor.
 * @param {cursorState} new_cursor
 * @param {cursorState} old_cursor
 * @package
 */
const setGlobalCursorStyle = (new_cursor, old_cursor) => {
    /*if (old_cursor)
        document.body.classList.toggle(cursorStyleClasses[old_cursor]);

    document.body.classList.toggle(cursorStyleClasses[new_cursor]);*/
    document.body.style.cursor = cursorStyle[new_cursor];
};


export {
    cursorState,
    cursorStyle,
    getCursorPos,
    setGlobalCursorStyle
};

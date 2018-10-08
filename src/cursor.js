/**
 * @module cursor
 */
'use strict';


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

const cursorStyleClasses = cursorStyle.map(i => 'react-win32dialog-cursor-' + i)

/**
 * @typedef {Object} CursorPos
 * @property {number} x Cursor's x position relative to
 * the web page.
 * @property {number} y Cursor's y position relative to
 * the web page.
 */

const getCursorPos = (ev) => ({
    x: ev.clientX + window.scrollX,
    y: ev.clientY + window.scrollY,
});

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

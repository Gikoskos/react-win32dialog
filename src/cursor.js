'use strict';

/**
 * @alias cursor:resizeState
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

const cursorStyle = [
    "react-win32dialog-cursor-default",
    "react-win32dialog-cursor-s-resize",
    "react-win32dialog-cursor-se-resize",
    "react-win32dialog-cursor-sw-resize",
    "react-win32dialog-cursor-n-resize",
    "react-win32dialog-cursor-ne-resize",
    "react-win32dialog-cursor-nw-resize",
    "react-win32dialog-cursor-e-resize",
    "react-win32dialog-cursor-w-resize",
];

const getCursorPos = (ev) => ({
    x: ev.clientX + window.scrollX,
    y: ev.clientY + window.scrollY,
});

const setGlobalCursorStyle = (new_cursor, old_cursor) => {
    if (old_cursor)
        document.body.classList.toggle(cursorStyle[old_cursor]);

    document.body.classList.toggle(cursorStyle[new_cursor]);
};


export {
    cursorState,
    cursorStyle,
    getCursorPos,
    setGlobalCursorStyle
};

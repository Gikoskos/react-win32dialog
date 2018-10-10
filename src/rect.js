/**
 * @module rect
 */
'use strict';

import { cursorState } from './cursor';


const defaultRect = {
    min_w: 118,
    min_h: 23,
    border_w: 2
};

/**
 * Returns true if (left <= p <= right).
 * False otherwise.
 */
function isBetween(p, left, right) {
    if (p >= left && p <= right)
        return true;

    return false;
}

/**
 * Represents a rectangular area that supports translation (i.e. resizing/moving).
 * It's used internally to represent the Win32Dialog's border.
 * @package
 */
export default class DialogRect {
    constructor(x, y, w, h, min_w, min_h, border_w) {
        this.borderWidth = (border_w && border_w >= defaultRect.border_w) ? border_w : defaultRect.border_w;

        this.minWidth = (min_w && min_w > 0) ? min_w : defaultRect.min_w;
        this.minHeight = (min_h && min_h > 0) ? min_h : defaultRect.min_h;

        //adapt minWidth and minHeight to the border width
        this.minWidth += 2 * this.borderWidth;
        this.minHeight += 2 * this.borderWidth;

        this.left = x || 1;
        this.top = y || 1;
        this.width = (w && w > this.minWidth) ? w : this.minWidth;
        this.height = (h && h > this.minHeight) ? h : this.minHeight;

        this.right = this.width + this.left;
        this.bottom = this.top + this.height;

        this.cursorOffset = { x: 0, y: 0 };
    }

    /**
     * Updates the rect's dimensions.
     * @private
     */
    _update(x, y, w, h) {
        if (x)
            this.left = x;

        if (y)
            this.top = y;

        if (w)
            this.width = w;

        if (h)
            this.height = h;

        this.right = this.width + this.left;
        this.bottom = this.top + this.height;
    }

    /**
     * Resizes the rect from the top edge.
     *               /\
     * ┌────────────────────────────┐
     * │             \/             │
     * │                            │
     * │                            │
     * │                            │
     * │                            │
     * └────────────────────────────┘
     * @private
     */
    _resizeTop(cursor_y) {
        if (cursor_y <= 0) {
            cursor_y = 1;
        }

        let new_height = this.height - (cursor_y - this.top),
            new_top = cursor_y;

        if (new_height < this.minHeight) {
            new_top -= this.minHeight - new_height;
            new_height = this.minHeight;
        }

        return [new_height, new_top];
    }

    /**
     * Resizes the rect from the left edge.
     *  ┌────────────────────────────┐
     *  │                            │
     *  │                            │
     * <│>                           │
     *  │                            │
     *  │                            │
     *  └────────────────────────────┘
     * @private
     */
    _resizeLeft(cursor_x) {
        if (cursor_x <= 0) {
            cursor_x = 1;
        }

        let diff_x = cursor_x - this.left,
            new_width = this.width - diff_x,
            new_left = this.left + diff_x;

        if (new_width < this.minWidth) {
            new_left -= this.minWidth - new_width;
            new_width = this.minWidth;
        }

        return [new_width, new_left];
    }

    /**
     * Resizes the rect from the bottom edge.
     * ┌────────────────────────────┐
     * │                            │
     * │                            │
     * │                            │
     * │                            │
     * │             /\             │
     * └────────────────────────────┘
     *               \/
     * @private
     */
    _resizeBottom(cursor_y) {
        let new_height = this.height + cursor_y - this.bottom;

        if (new_height < this.minHeight) {
            new_height = this.minHeight;
        }

        return new_height;
    }

    /**
     * Resizes the rect from the right edge.
     * ┌────────────────────────────┐
     * │                            │
     * │                            │
     * │                           <│>
     * │                            │
     * │                            │
     * └────────────────────────────┘
     * @private
     */
    _resizeRight(cursor_x) {
        let new_width = this.width + cursor_x - this.right;

        if (new_width < this.minWidth) {
            new_width = this.minWidth;
        }

        return new_width;
    }

    /**
     * Resizes the rect.
     * @param {module:cursor/CursorPos} cursor_pos
     * @param {module:cursor/cursorState} resize_type
     * @package
     */
    resizeToCursor(cursor_pos, resize_type) {
        let new_top, new_left, new_width, new_height;

        cursor_pos.x += this.cursorOffset.x;
        cursor_pos.y += this.cursorOffset.y;

        switch (resize_type) {

        case cursorState.right:
            new_width = this._resizeRight(cursor_pos.x);
            break;

        case cursorState.left:
            [new_width, new_left] = this._resizeLeft(cursor_pos.x);
            break;

        case cursorState.top:
            [new_height, new_top] = this._resizeTop(cursor_pos.y);
            break;

        case cursorState.bottom:
            new_height = this._resizeBottom(cursor_pos.y);
            break;

        case cursorState.bottomright:
            new_height = this._resizeBottom(cursor_pos.y);
            new_width = this._resizeRight(cursor_pos.x);
            break;

        case cursorState.bottomleft:
            new_height = this._resizeBottom(cursor_pos.y);
            [new_width, new_left] = this._resizeLeft(cursor_pos.x);
            break;

        case cursorState.topright:
            [new_height, new_top] = this._resizeTop(cursor_pos.y);
            new_width = this._resizeRight(cursor_pos.x);
            break;

        case cursorState.topleft:
            [new_height, new_top] = this._resizeTop(cursor_pos.y);
            [new_width, new_left] = this._resizeLeft(cursor_pos.x);
            break;

        //passthrough is intentional here
        case cursorState.regular:
        default:
            break;
        }

        this._update(new_left, new_top, new_width, new_height);
    }

    /**
     * Returns a {module:cursor/cursorState} value that represents
     * the cursor's state in relation to the rect.
     * For example if the cursor is on top of the rect's right edge,
     * it will return cursorState.right.
     * @param {module:cursor/CursorPos} cursor_pos
     * @package
     */
    getCursorResizeState(cursor_pos) {
        const dgOffset = 4,
              widthOffset = this.borderWidth + 2,
              totalOffset = widthOffset + dgOffset;

        if (isBetween(cursor_pos.x, this.right - widthOffset, this.right)) {
            /**
             * Cases where the cursor's position is either on the right edge of the dialog's
             * border, or on top/below it.
             *                             ██
             *                             ██
             * ┌───────────────────────────═╗
             * │ React Win32 dialog box     ║
             * ├────────────────────────────╢
             * │                            ║
             * │                            ║
             * │                            ║
             * └───────────────────────────═╝
             *                             ██
             *                             ██
             */

            if (isBetween(cursor_pos.y, this.top, this.bottom)) {

                /**
                 * Cases where the cursor's position is on the right edge of the border.
                 * ┌───────────────────────────═╗
                 * │ React Win32 dialog box     ║
                 * ├────────────────────────────╢
                 * │                            ║
                 * │                            ║
                 * │                            ║
                 * └───────────────────────────═╝
                 */
                if (cursor_pos.y >= (this.bottom - totalOffset)) {
                    return cursorState.bottomright;
                } else if (cursor_pos.y <= (this.top + totalOffset)) {
                    return cursorState.topright;
                } else {
                    return cursorState.right;
                }

            }

        } else if (isBetween(cursor_pos.x, this.left, this.left + widthOffset)) {
            /**
             * Cases where the cursor's position is either on the left edge of the dialog's.
             * border, or on top/below it.
             * ██
             * ██
             * ╔═───────────────────────────┐
             * ║ React Win32 dialog box     │
             * ╟────────────────────────────┤
             * ║                            │
             * ║                            │
             * ║                            │
             * ╚═───────────────────────────┘
             * ██
             * ██
             */

            if (isBetween(cursor_pos.y, this.top, this.bottom)) {

                /**
                 * Cases where the cursor's position is on the left edge of the border.
                 * ╔═───────────────────────────┐
                 * ║ React Win32 dialog box     │
                 * ╟────────────────────────────┤
                 * ║                            │
                 * ║                            │
                 * ║                            │
                 * ╚═───────────────────────────┘
                 */
                if (cursor_pos.y >= (this.bottom - totalOffset)) {
                    return cursorState.bottomleft;
                } else if (cursor_pos.y <= (this.top + totalOffset)) {
                    return cursorState.topleft;
                } else {
                    return cursorState.left;
                }

            }

        } else if (isBetween(cursor_pos.x, this.left, this.right)) {
            /**
             * Cases where the cursor's position is either on the top or bottom edges of the
             * dialog's border, or on the areas right above or below them.
             *   ██████████████████████████
             *   ██████████████████████████
             * ┌─══════════════════════════─┐
             * │ React Win32 dialog box     │
             * ├────────────────────────────┤
             * │                            │
             * │                            │
             * │                            │
             * └─══════════════════════════─┘
             *   ██████████████████████████
             *   ██████████████████████████
             */

            if (isBetween(cursor_pos.y, this.bottom - widthOffset, this.bottom)) {
                /**
                 * Case where the cursor's position is on the bottom edge of the dialog's border.
                 * ┌────────────────────────────┐
                 * │ React Win32 dialog box     │
                 * ├────────────────────────────┤
                 * │                            │
                 * │                            │
                 * │                            │
                 * └─══════════════════════════─┘
                 */
                return cursorState.bottom;
            
            } else if (isBetween(cursor_pos.y, this.top, this.top + widthOffset)) {
                /**
                 * Case where the cursor's position is on the top edge of the dialog's border.
                 * ┌─══════════════════════════─┐
                 * │ React Win32 dialog box     │
                 * ├────────────────────────────┤
                 * │                            │
                 * │                            │
                 * │                            │
                 * └────────────────────────────┘
                 */
                return cursorState.top;
            }

        }

        return cursorState.regular;
    }

    /**
     * Stretches the rect's edges so that they cover the entire
     * viewport.
     * @package
     */
    coverViewport() {
        this._update(1, 1, window.innerWidth, window.innerHeight);
    }

    /**
     * Moves the rect.
     * @param {module:cursor/CursorPos} cursor_pos
     * @package
     */
    moveToCursor(cursor_pos) {
        this._update(cursor_pos.x + this.cursorOffset.x,
                     cursor_pos.y + this.cursorOffset.y);
    }

    /**
     * Stores the cursor's offset in relation to the rect's edges.
     * This method should be called once, right before a move/resize operation,
     * just after the user clicks on the dialog's edges or titlebar.
     *
     * Below is an illustration of a dialog's titlebar. The asterisk (*) symbolizes
     * the point where the user clicked in order to move the window (that's
     * also the point stored in cursor_pos).
     * This is how the offsets are calculated in the move operation:
     *
     *                ╠═══ x offset ═══╣
     *     ╦     ┌───────────────────────────────────────────────────────┐
     *  y offset │                                                       │
     *     ╩     │                *                                      │
     *           ├───────────────────────────────────────────────────────┤
     *           │                                                       │
     *
     * @param {module:cursor/CursorPos} cursor_pos If it's undefined then
     * this method just resets the internal offset values.
     * @param {module:cursor/cursorState} resize_type If it's undefined then
     * this method sets up the offsets for a move operation. Otherwise it sets
     * the offsets for a resize operation. This parameter is only used if
     * cursor_pos is defined.
     * @package
     */
    setCursorOffset(cursor_pos, resize_type) {
        this.cursorOffset.x = this.cursorOffset.y = 0;

        if (cursor_pos) {
            switch (resize_type) {

            case cursorState.right:
                this.cursorOffset.x = this.right - cursor_pos.x;
                break;
    
            case cursorState.left:
                this.cursorOffset.x = this.left - cursor_pos.x;
                break;
    
            case cursorState.top:
                this.cursorOffset.y = this.top - cursor_pos.y;
                break;
    
            case cursorState.bottom:
                this.cursorOffset.y = this.bottom - cursor_pos.y;
                break;
    
            case cursorState.bottomright:
                this.cursorOffset.x = this.right - cursor_pos.x;
                this.cursorOffset.y = this.bottom - cursor_pos.y;
                break;
    
            case cursorState.bottomleft:
                this.cursorOffset.x = this.left - cursor_pos.x;
                this.cursorOffset.y = this.bottom - cursor_pos.y;
                break;
    
            case cursorState.topright:
                this.cursorOffset.x = this.right - cursor_pos.x;
                this.cursorOffset.y = this.top - cursor_pos.y;
                break;
    
            case cursorState.topleft:
                this.cursorOffset.x = this.left - cursor_pos.x;
                this.cursorOffset.y = this.top - cursor_pos.y;
                break;
    
            case cursorState.regular:
                break;

            default:
                this.cursorOffset.x = this.left - cursor_pos.x;
                this.cursorOffset.y = this.top - cursor_pos.y;
                break;
            }
        }
    }

    /**
     * Resets the rect's position to the upper left corner of the viewport.
     * @package
     */
    moveWithinViewport() {
        this._update((this.left <= 0) ? 1 : this.left,
                     (this.top <= 0) ? 1 : this.top);
    }

    /**
     * @package
     */
    toString() {
        return `DialogRect = {\n` +
               `    .left = ${this.left},\n` +
               `    .top = ${this.top},\n` +
               `    .width = ${this.width},\n` +
               `    .height = ${this.height},\n` +
               `    .minWidth = ${this.minWidth},\n` +
               `    .minHeight = ${this.minHeight}\n` +
               `}`;
    }
}

/**
 * @module rect
 */
'use strict';

import { cursorState } from './cursor';


const defaultRect = {
    w: 170,
    h: 170,
    min_w: 118,
    min_h: 23,
    max_w: 300,
    max_h: 300,
    border_w: 2
};

function isBetween(p, left, right) {
    if (p >= left && p <= right)
        return true;

    return false;
}

/**
 * @package
 */
export default class DialogRect {
    constructor(x, y, min_w, min_h, max_w, max_h, border_w) {
        this.borderWidth = (border_w && border_w >= defaultRect.border_w) ? border_w : defaultRect.border_w;

        this.minWidth = (min_w && min_w > 0) ? min_w : defaultRect.min_w;
        this.minHeight = (min_h && min_h > 0) ? min_h : defaultRect.min_h;

        this.maxWidth = (max_w && max_w >= this.minWidth) ? max_w : defaultRect.max_w;
        this.maxHeight = (max_h && max_h >= this.minHeight) ? max_h : defaultRect.max_h;

        //adapt minWidth and minHeight to the border width
        this.minWidth += 2 * this.borderWidth;
        this.minHeight += 2 * this.borderWidth;

        this.left = x || 1;
        this.top = y || 1;
        this.width = defaultRect.w;
        this.height = defaultRect.h;

        this.right = this.width + this.left;
        this.bottom = this.top + this.height;

        this.cursorOffset = { x: 0, y: 0 };
    }

    /**
     * @package
     */
    update(x, y, w, h) {
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
     * @package
     */
    resizeToCursor(resize_type, cursor_pos) {
        let new_top, new_left, new_width, new_height;

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

        this.update(new_left, new_top, new_width, new_height);
    }

    /**
     * @package
     */
    getCursorResizeState(cursor_pos) {
        const dgOffset = 4,
              widthOffset = this.borderWidth + 1,
              totalOffset = widthOffset + dgOffset;

        if (isBetween(cursor_pos.x, this.right - widthOffset, this.right)) {

            if (isBetween(cursor_pos.y, this.top, this.bottom)) {

                if (cursor_pos.y >= (this.bottom - totalOffset)) {
                    return cursorState.bottomright;
                } else if (cursor_pos.y <= (this.top + totalOffset)) {
                    return cursorState.topright;
                } else {
                    return cursorState.right;
                }

            }

        } else if (isBetween(cursor_pos.x, this.left, this.left + widthOffset)) {

            if (isBetween(cursor_pos.y, this.top, this.bottom)) {

                if (cursor_pos.y >= (this.bottom - totalOffset)) {
                    return cursorState.bottomleft;
                } else if (cursor_pos.y <= (this.top + totalOffset)) {
                    return cursorState.topleft;
                } else {
                    return cursorState.left;
                }

            }

        } else if (isBetween(cursor_pos.x, this.left, this.right)) {

            if (isBetween(cursor_pos.y, this.bottom - widthOffset, this.bottom)) {
                return cursorState.bottom;
            } else if (isBetween(cursor_pos.y, this.top, this.top + widthOffset)) {
                return cursorState.top;
            }

        }

        return cursorState.regular;
    }

    /**
     * @package
     */
    moveToCursor(cursor_pos) {
        this.update(cursor_pos.x - this.cursorOffset.x,
                    cursor_pos.y - this.cursorOffset.y);
    }

    /**
     * @package
     */
    setCursorOffset(cursor_pos) {
        this.cursorOffset.x = cursor_pos.x - this.left;
        this.cursorOffset.y = cursor_pos.y - this.top;
    }

    /**
     * @package
     */
    moveWithinViewport() {
        this.update((this.left <= 0) ? 1 : this.left,
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
               `    .minHeight = ${this.minHeight},\n` +
               `    .maxWidth = ${this.maxWidth},\n` +
               `    .maxHeight = ${this.maxHeight}\n` +
               `}`;
    }
}

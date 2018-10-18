/**
 * @module globals
 */
'use strict';


const NO_VALUE = -1;

const _doc_element = document.documentElement;

const getViewportWidth = () => (
    (window.innerWidth > _doc_element.clientWidth) ? _doc_element.clientWidth : window.innerWidth
);

export {
    NO_VALUE,
    getViewportWidth
};

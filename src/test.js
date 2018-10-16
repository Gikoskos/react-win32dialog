/**
 * This module has various unit tests for the react-win32dialog components.
 */

import React from 'react';
import {
    configure,
    shallow,
    mount,
    render
} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import Win32Dialog from './index';
import Tooltip from './tooltip';
import { NO_VALUE } from './globals';
import { TitlebarButton, titlebarButtons } from './titlebarbutton';
import { cursorState } from './cursor';

configure({ adapter: new Adapter() });


describe('<Win32Dialog />', () => {
    let wrapper;

    const mountTestDialog = (props) => {
        if (!wrapper) {
            if (props) {
                wrapper = mount(<Win32Dialog {...props}/>);
            } else {
                wrapper = mount(<Win32Dialog/>);
            }
        }
        return wrapper;
    };

    const unmountTestDialog = () => {
        if (wrapper) {
            wrapper.unmount();
        }

        wrapper = undefined;
    };

    afterEach(() => {
        unmountTestDialog();
    });

    it('focuses/blurs', () => {
        let hasFocus;

        mountTestDialog({
            onFocus: () => hasFocus = true,
            onBlur: () => hasFocus = false
        });

        wrapper.instance().updateWindowFocus(true);
        expect(wrapper.state('hasFocus')).toBeTruthy();
        expect(hasFocus).toBeTruthy();
        wrapper.instance().updateWindowFocus(false);
        expect(wrapper.state('hasFocus')).toBeFalsy();
        expect(hasFocus).toBeFalsy();
    });

    describe('Rendering', () => {
        let nodes;

        beforeEach(() => {
            mountTestDialog();
        });

        it('uses a single Tooltip component', () => {
            nodes = wrapper.find('Tooltip');
            expect(nodes.length).toBe(1);
        });

        it('draws outter border div', () => {
            nodes = wrapper.find('.react-win32dialog-outer-border');
            expect(nodes.length).toBe(1);
            expect(nodes.name()).toBe('div');
        });

        it('draws titlebar border div', () => {
            nodes = wrapper.find('.react-win32dialog-titlebar');
            expect(nodes.length).toBe(1);
            expect(nodes.name()).toBe('div');
            expect(nodes.parent().hasClass('react-win32dialog-outer-border')).toBeTruthy();
        });

        it('draws titlebar icon img', () => {
            nodes = wrapper.find('.react-win32dialog-titlebar-icon');
            expect(nodes.length).toBe(1);
            expect(nodes.name()).toBe('img');
            expect(nodes.parent().hasClass('react-win32dialog-titlebar')).toBeTruthy();
        });

        it('draws titlebar title span', () => {
            nodes = wrapper.find('span');
            expect(nodes.parent().hasClass('react-win32dialog-titlebar')).toBeTruthy();
        })

        it('draws titlebar button area div', () => {
            nodes = wrapper.find('.react-win32dialog-titlebar-buttons');
            expect(nodes.length).toBe(1);
            expect(nodes.name()).toBe('div');
            expect(nodes.parent().hasClass('react-win32dialog-titlebar')).toBeTruthy();
        });

        it('draws 3 TitlebarButton components', () => {
            nodes = wrapper.find('TitlebarButton');
            expect(nodes.length).toBe(3);
            expect(nodes.at(0).parent().hasClass('react-win32dialog-titlebar-buttons')).toBeTruthy();
            expect(nodes.at(1).parent().hasClass('react-win32dialog-titlebar-buttons')).toBeTruthy();
            expect(nodes.at(2).parent().hasClass('react-win32dialog-titlebar-buttons')).toBeTruthy();
        });
    })

    describe('Size', () => {
        it("resizes left border but doesn't exceed screen boundaries", () => {
            mountTestDialog({
                x: 50
            });

            let startLeft = wrapper.state('left'),
                currWidth = wrapper.state('width'), i;

            //resize to the left
            for (i = startLeft; i > -50; i--) {
                wrapper.instance().updateWindowSize({ x: i }, cursorState.left);

                if (i <= 0) {
                    if (!i) currWidth--;

                    expect(wrapper.state('left')).toBeGreaterThanOrEqual(1);
                    expect(wrapper.state('width')).toBe(currWidth);
                } else {
                    expect(wrapper.state('left')).toBe(i);
                    expect(wrapper.state('width')).toBe(currWidth++);
                }
            }

            //resize to the right
            for (; i < 50; i++) {
                wrapper.instance().updateWindowSize({ x: i }, cursorState.left);
                if (i <= 0) {
                    expect(wrapper.state('left')).toBeGreaterThanOrEqual(1);
                    expect(wrapper.state('width')).toBe(currWidth);
                } else {
                    expect(wrapper.state('left')).toBe(i);
                    expect(wrapper.state('width')).toBe(currWidth--);
                }
            }
        });

        it("resizes top border but doesn't exceed screen boundaries", () => {
            mountTestDialog({
                y: 50
            });

            let startTop = wrapper.state('top'),
                currHeight = wrapper.state('height'), i

            //resize to the top
            for (i = startTop; i > -50; i--) {
                wrapper.instance().updateWindowSize({ y: i }, cursorState.top);
                if (i <= 0) {
                    if (!i) currHeight--;

                    expect(wrapper.state('top')).toBeGreaterThanOrEqual(1);
                    expect(wrapper.state('height')).toBe(currHeight);
                } else {
                    expect(wrapper.state('top')).toBe(i);
                    expect(wrapper.state('height')).toBe(currHeight++);
                }
            }

            //resize to the bottom
            for (; i < 50; i++) {
                wrapper.instance().updateWindowSize({ y: i }, cursorState.top);
                if (i <= 0) {
                    expect(wrapper.state('top')).toBeGreaterThanOrEqual(1);
                    expect(wrapper.state('height')).toBe(currHeight);
                } else {
                    expect(wrapper.state('top')).toBe(i);
                    expect(wrapper.state('height')).toBe(currHeight--);
                }
            }
        });
    });

    describe('Size', () => {
        beforeEach(() => {
            mountTestDialog();
        });

        it("resizes right border", () => {
            let startRight = wrapper.state('right'),
                currWidth = wrapper.state('width'), i;

            //resize to the right
            for (i = startRight; i < 2000; i++, currWidth++) {
                wrapper.instance().updateWindowSize({ x: i }, cursorState.right);
                expect(wrapper.state('right')).toBe(i);
                expect(wrapper.state('width')).toBe(currWidth);
            }

            //resize to the left
            for (; i > 100; i--, currWidth--) {
                wrapper.instance().updateWindowSize({ x: i }, cursorState.right);
                expect(wrapper.state('right')).toBe(i);
                expect(wrapper.state('width')).toBe(currWidth);
            }
        });

        it("resizes bottom border", () => {
            let startBottom = wrapper.state('bottom'),
                currHeight = wrapper.state('height'), i

            //resize to the bottom
            for (let i = startBottom; i < 2000; i++, currHeight++) {
                wrapper.instance().updateWindowSize({ x: i }, cursorState.bottom);
                expect(wrapper.state('bottom')).toBe(i);
                expect(wrapper.state('height')).toBe(currHeight);
            }

            //resize to the top
            for (; i > 100; i--, currHeight--) {
                wrapper.instance().updateWindowSize({ x: i }, cursorState.bottom);
                expect(wrapper.state('bottom')).toBe(i);
                expect(wrapper.state('height')).toBe(currHeight);
            }
        });
    });

    describe('Position', () => {
        beforeEach(() => {
            mountTestDialog();
        });

        it('moves window at random', () => {
            let new_x, new_y;

            for (let i = 0; i < 100; i++) {
                new_x = Math.random();
                new_y = Math.random();

                wrapper.instance().updateWindowPosition({ x: new_x, y: new_y });
                expect(wrapper.state('left')).toBe(new_x);
                expect(wrapper.state('top')).toBe(new_y);
            }
        });

        it('fixes position if the window goes offscreen', () => {
            wrapper.instance().updateWindowPosition({ x: -50, y: -50 });
            wrapper.instance().fixOffScreenMove();
            expect(wrapper.state('left')).toBe(1);
            expect(wrapper.state('top')).toBe(1);
        });
    });

    describe('Tooltip', () => {
        const defaultPos = {x: 1, y: 1};
        let tooltipZIndex;

        beforeEach(() => {
            mountTestDialog();
            tooltipZIndex = wrapper.state('zIndex') + 1;
        });

        it('has zeroed out state by default', () => {
            expect(wrapper.state('tooltipArgs')).toMatchObject({
                msg: '',
                position: null,
                zIndex: 0
            });
        });

        it('is activated when showTooltip is called', () => {
            wrapper.instance().cursorOnTitlebarButtons = true;
            wrapper.instance().hoverTitlebarButton = titlebarButtons.minimize;

            expect(wrapper.instance().showTooltip(defaultPos, tooltipZIndex)).toBeTruthy();
        });

        //due to some "bug" in enzyme I can't change the props that are sent
        //to a nested functional/stateless component (from my tests, they
        //always have their initial value) so instead I'm testing the state
        //of Win32Dialog, and I have different tests for the Tooltip component
        //that test whether the props are received correctly or not
        it('sets correct state in case of minimize button', () => {
            wrapper.instance().cursorOnTitlebarButtons = true;
            wrapper.instance().hoverTitlebarButton = titlebarButtons.minimize;

            wrapper.instance().showTooltip(defaultPos, tooltipZIndex);

            expect(wrapper.state('tooltipArgs')).toMatchObject({
                position: defaultPos,
                zIndex: tooltipZIndex,
                msg: Win32Dialog.tooltipMessages[titlebarButtons.minimize]
            });
        });

        it('sets correct state in case of maximize button', () => {
            wrapper.instance().cursorOnTitlebarButtons = true;
            wrapper.instance().hoverTitlebarButton = titlebarButtons.maximize;

            wrapper.instance().showTooltip(defaultPos, tooltipZIndex);

            expect(wrapper.state('tooltipArgs')).toMatchObject({
                position: defaultPos,
                zIndex: tooltipZIndex,
                msg: Win32Dialog.tooltipMessages[titlebarButtons.maximize]
            });
        });

        it('sets correct state in case of close button', () => {
            wrapper.instance().cursorOnTitlebarButtons = true;
            wrapper.instance().hoverTitlebarButton = titlebarButtons.close;

            wrapper.instance().showTooltip(defaultPos, tooltipZIndex);

            expect(wrapper.state('tooltipArgs')).toMatchObject({
                position: defaultPos,
                zIndex: tooltipZIndex,
                msg: Win32Dialog.tooltipMessages[titlebarButtons.close]
            });
        });

        it('sets correct state in case of restore button', () => {
            wrapper.instance().isMaximized = wrapper.instance().cursorOnTitlebarButtons = true;
            wrapper.instance().hoverTitlebarButton = titlebarButtons.maximize;

            wrapper.instance().showTooltip(defaultPos, tooltipZIndex);

            expect(wrapper.state('tooltipArgs')).toMatchObject({
                position: defaultPos,
                zIndex: tooltipZIndex,
                msg: Win32Dialog.tooltipMessages[Win32Dialog.tooltipMessages.length - 1]
            });
        });

        it('is destroyed when closeTooltip is called', () => {
            wrapper.instance().cursorOnTitlebarButtons = true;
            wrapper.instance().hoverTitlebarButton = titlebarButtons.minimize;

            wrapper.instance().showTooltip(defaultPos, tooltipZIndex);
            wrapper.instance().closeTooltip();

            expect(wrapper.state('tooltipArgs')).toMatchObject({
                msg: '',
                position: null
            });
        });
    });

    describe('Titlebar buttons', () => {
        let buttonarea, btnId;

        beforeEach(() => {
            mountTestDialog();
            buttonarea = wrapper.find('.react-win32dialog-titlebar-buttons');
            btnId = titlebarButtons.minimize;
        });

        afterEach(() => {
            buttonarea = undefined;
        });


        it('buttons are hovered', () => {
            let btnId = 0;

            wrapper.find('TitlebarButton').forEach((btn) => {
                btn.find('div').simulate('mouseenter');
                expect(wrapper.instance().hoverTitlebarButton).toBe(btnId++);
            });
        });

        it('buttons are pushed and released', () => {
            wrapper.find('TitlebarButton').forEach((btn) => {
                expect(wrapper.state('activeTitlebarButton')).toBe(NO_VALUE);

                buttonarea.simulate('mouseenter');
                btn.find('div').simulate('mouseenter');
                wrapper.instance().pushTitlebarButton();
                expect(wrapper.state('activeTitlebarButton')).toBe(btnId++);

                wrapper.instance().releaseTitlebarButton()
                expect(wrapper.state('activeTitlebarButton')).toBe(NO_VALUE);
            });
        });

        it('minimize button handler sets isMinimized', () => {
            expect(wrapper.instance().isMinimized).toBeFalsy();
            wrapper.instance().handleTitlebarButtonClick(btnId);
            expect(wrapper.instance().isMinimized).toBeTruthy();
        });

        it('maximize button handler sets isMaximized', () => {
            btnId = titlebarButtons.maximize;
            expect(wrapper.instance().isMaximized).toBeFalsy();
            wrapper.instance().handleTitlebarButtonClick(btnId);
            expect(wrapper.instance().isMaximized).toBeTruthy();
        });

        it('close button handler calls onExit', () => {
            let onExitWasPushed = false;

            wrapper.setProps({onExit: () => {
                onExitWasPushed = true;
            }});

            btnId = titlebarButtons.close;

            wrapper.instance().handleTitlebarButtonClick(btnId);
            expect(onExitWasPushed).toBeTruthy();
        });

        it('maximize handler is a no-op if isMinimized is set', () => {
            btnId = titlebarButtons.maximize;

            wrapper.instance().isMinimized = true;
            wrapper.instance().handleTitlebarButtonClick(btnId);
            expect(wrapper.instance().isMaximized).toBeFalsy();
        });

        it('minimize handler is a no-op if isMaximized is set', () => {
            wrapper.instance().isMaximized = true;
            wrapper.instance().handleTitlebarButtonClick(btnId);
            expect(wrapper.instance().isMinimized).toBeFalsy();
        });
    }); 
});

describe('<Tooltip />', () => {
    const testProps = {
        position: {x: 1, y: 1},
        zIndex: 1,
        msg: 'Hello world'
    };

    it('receives args object prop', () => {
        expect(mount(<Tooltip args={testProps}/>).prop('args')).toMatchObject(testProps);
    });

    it('renders a single tooltip border div', () => {
        const borderNode = mount(<Tooltip args={testProps}/>).find('div');

        expect(borderNode).toBeTruthy();
        expect(borderNode.length).toBe(1);
        expect(borderNode.hasClass('react-win32dialog-tooltip')).toBeTruthy();
    });

    it('div dimensions are computed from given props', () => {
        const borderNodeStyle = mount(<Tooltip args={testProps}/>).find('div').getDOMNode().style;
        let val;

        val = parseInt(borderNodeStyle.left.slice(0, borderNodeStyle.left.lastIndexOf('px')));
        expect(val).toBe(testProps.position.x);

        val = parseInt(borderNodeStyle.top.slice(0, borderNodeStyle.top.lastIndexOf('px')));
        expect(val).toBeGreaterThan(testProps.position.y);

        val = parseInt(borderNodeStyle['z-index']);
        expect(val).toBe(testProps.zIndex);
    });

    it('returns null if no position is defined', () => {
        expect(shallow(<Tooltip args={{position: null}}/>).type()).toBeNull();
    });
});

describe('<Titlebar />', () => {
    it('renders a single border div', () => {
        const divNode = shallow(<TitlebarButton />).find('div');
        expect(divNode.length).toBe(1);
        expect(divNode.hasClass('react-win32dialog-titlebar-button')).toBeTruthy();
    });

    it('renders a single icon img', () => {
        const btnNode = shallow(<TitlebarButton />);
        const imgNode = btnNode.find('img');
        expect(imgNode.length).toBe(1);
        expect(imgNode.parent().hasClass('react-win32dialog-titlebar-button')).toBeTruthy();
    });

    it('can get toggled', () => {
        const divNode = mount(<TitlebarButton toggled={true}/>).find('div');
        expect(divNode.hasClass('react-win32dialog-titlebar-button-active')).toBeTruthy();
    });

    it('handles mouseenter', () => {
        let isHovered = false,
            onEnterFn = () => (isHovered = true),
            onLeaveFn = () => (isHovered = false);
        const divNode = mount(<TitlebarButton onEnter={onEnterFn} onLeave={onLeaveFn}/>).find('div');

        divNode.simulate('mouseenter');
        expect(isHovered).toBeTruthy();
        divNode.simulate('mouseleave');
        expect(isHovered).toBeFalsy();
    });
});

describe('WindowManager', () => {
    const wm = Win32Dialog.windowManager;

    describe('single window', () => {
        let wrapper;

        beforeAll(() => {
            if (!wrapper) {
                wrapper = mount(<Win32Dialog />);
            }
        });

        afterAll(() => {
            wrapper.unmount();
        });

        it('zIndexTop property has value 1', () => {
            expect(wm.zIndexTop).toBe(1);
        });
    });

    describe('multiple windows', () => {
        const arrLen = 5, lastIdx = arrLen - 1;
        let winArr;

        beforeEach(() => {
            //create 100 windows
            if (!winArr) {
                winArr = new Array(arrLen);
                for (let i = 0; i < arrLen; i++) {
                    winArr[i] = mount(<Win32Dialog />);
                }
            }
        });

        it('checks if only the top window has focus', () => {
            for (let i = 0; i < lastIdx; i++) {
                expect(winArr[i].state('hasFocus')).toBeFalsy();
            }

            expect(winArr[lastIdx].state('hasFocus')).toBeTruthy();
        });

        it('check that all windows have proper z-indexes', () => {
            for (let i = 0; i < lastIdx; i++) {
                expect(winArr[i].state('zIndex')).toBe(i);
            }

            expect(winArr[lastIdx].state('zIndex')).toBe(wm.zIndexTop - 1);
        });
        
        describe('unregister a single window', () => {
            beforeEach(() => {
                winArr[2].unmount();
                winArr[2] = null;
            });
            
            afterEach(() => {
                for (let i = 0; i < arrLen; i++) {
                    if (winArr[i]) winArr[i].unmount();
                }
                
                winArr = null;
            });
            
            it('check that the z-indexes are fixed', () => {
                for (let i = 0, zIndex = 0; i < lastIdx; i++) {
                    if (winArr[i]) {
                        expect(winArr[i].state('zIndex')).toBe(zIndex);
                        zIndex++;
                    }
                }
            });

            it('check that only the next top window gains focus', () => {
                for (let i = 0; i < lastIdx; i++) {
                    if (winArr[i]) {
                        expect(winArr[i].state('hasFocus')).toBeFalsy();
                    }
                }
                
                expect(winArr[lastIdx].state('hasFocus')).toBeTruthy();
            });
        });

        describe('unregister multiple windows', () => {
            it('check that the top window always has focus while unregistering the bottom windows', () => {
                for (let i = 0; i < lastIdx; i++) {
                    winArr[i].unmount();
                    for (let j = i + 1; j < lastIdx; j++) {
                        expect(winArr[j].state('hasFocus')).toBeFalsy();
                    }
                }
    
                expect(winArr[lastIdx].state('hasFocus')).toBeTruthy();
                winArr = null;
            });
    
            it('check that the z-indexes are fixed while unregistering the bottom windows', () => {
                for (let i = 0; i < lastIdx; i++) {
                    winArr[i].unmount();
                    for (let j = i + 1, zIndex = 1; j < lastIdx; j++, zIndex++) {
                        expect(winArr[j].state('zIndex')).toBe(zIndex);
                    }
                }
    
                expect(winArr[lastIdx].state('zIndex')).toBe(1);
                winArr = null;
            });
        });
    });
});

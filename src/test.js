import React from 'react';
import {
    configure,
    shallow,
    mount,
    render
} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import Win32Dialog from './index';
import { NO_VALUE } from './globals';
import { titlebarButtons } from './titlebarbutton';
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
        wrapper.instance().updateWindowFocus(false);
        expect(wrapper.state('hasFocus')).toBeFalsy();
    });

    describe('Rendering', () => {
        let nodes;

        beforeEach(() => {
            mountTestDialog();
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

    describe('Titlebar buttons', () => {
        let buttonarea, titlebar, btnId;

        beforeEach(() => {
            mountTestDialog();
            buttonarea = wrapper.find('.react-win32dialog-titlebar-buttons');
            titlebar = wrapper.find('.react-win32dialog-titlebar');
            btnId = titlebarButtons.minimize;
        });

        afterEach(() => {
            titlebar = buttonarea = undefined;
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

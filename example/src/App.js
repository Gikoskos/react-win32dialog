import React, { Component } from 'react';
import Win32Dialog from 'react-win32dialog';
import Playground from 'component-playground';


function appendCounterToStrFactory(str) {
    let counter = 0;

    return () => (str + counter++);
}

const nextDocblockName = appendCounterToStrFactory('Doc'),
      nextCodeblockName = appendCounterToStrFactory('Code');

const win32DialogTutorial = [{
    title: nextDocblockName(),
    description: (<span><strong>Win32Dialog</strong> windows act a lot like classic
Windows OS dialog boxes.</span>)
}, {
    title: nextDocblockName(),
    description: (<span><p>They can be resized by left-clicking and dragging from any edge.</p>
<p><img src="red-border.png" alt="window with red border"/></p></span>)
}, {
    title: nextDocblockName(),
    description: (<span><p>They can be moved around by left-clicking and dragging
the titlebar.</p>
<p><img src="red-titlebar.png" alt="window with red titlebar"/></p></span>)
}, {
    title: nextDocblockName(),
    description: (<span><p>They can be minimized, maximized and closed by using the titlebar
buttons.</p>
<p><img src="red-buttons.png" alt="window with red buttons"/></p></span>)
}, {
    title: nextCodeblockName(),
    code: `\
<Win32Dialog
    title="Position example"
    x=dialogXPos
    y=dialogYPos
>
    Hello world!
</Win32Dialog>`,
    description: (<span>The <code>x</code> and <code>y</code> props can be used to
initialize a window at a specific point within the viewport. The (0, 0) point is considered
the upper left corner of the viewport.<br/>
Try removing both or either of the props from the live editor below, to see the default
values of each.</span>)
}, {
    title: nextCodeblockName(),
    code: `\
<Win32Dialog
    title="Width and height"
    x=dialogXPos
    y=dialogYPos
    width=dialogWidth
    height={250}
>
    Hello world!
</Win32Dialog>`,
    description: (<span>The <code>width</code> and <code>height</code> props can be used
to set the window's initial width and height respectively. Measured in pixels.<br/>
Note that if the <code>width</code> or <code>height</code> values are less than the
default <code>minWidth</code> and <code>minHeight</code> values, then they are ignored,
and the window's width or height get initialized to those instead. See
the <code>minWidth</code> and <code>minHeight</code> props below for more info.</span>)
}, {
    title: nextDocblockName(),
    description: (<span>A <strong>Win32Dialog</strong>'s position and dimensions are fixed
on the viewport and won't change unless the user changes them explicitly by resizing, 
moving, maximizing or minimizing the window.</span>)
}, {
    title: nextCodeblockName(),
    code: `\
<Win32Dialog
    title="minWidth and minHeight example"
    x=dialogXPos
    y=dialogYPos
    width=dialogWidth
    height={250}
    minWidth={200}
    minHeight={100}
>
    <div
        style={{
            backgroundColor: 'purple',
            width: '100%',
            height: '100%',
        }}
    >
    </div>
</Win32Dialog>`,
    description: (<span>The <code>minWidth</code> and <code>minHeight</code> props can be
used to set the window's minimum width and height respectively.<br/>
A window can't get resized to smaller dimensions than those values. Note that <strong>Win32Dialog
</strong> windows don't get minimized to any kind of taskbar, but instead they get resized
to their minimum dimensions which can be controlled through these props.</span>)
}, {
    title: nextDocblockName(),
    description: (<span>When a window is minimized, it resizes to its minimum width
and height. A minimized window can't get resized by the user with the mouse pointer, but it can
be moved around. To restore the window's ability to get resized by its edges, un-minimize it by
clicking the minimize button again.</span>)
}, {
    title: nextCodeblockName(),
    code: `\
<Win32Dialog
    title="title and icon example"
    icon="firefox_icon.png"
    x=dialogXPos
    y=dialogYPos
    width=dialogWidth
    height={250}
>
    <div
        style={{
            borderWidth: 5,
            borderStyle: 'solid',
            borderColor: 'black',
        }}
    >
        Try changing this window's title prop!
    </div>
</Win32Dialog>`,
    description: (<span>The <code>title</code> and <code>icon</code> props can be
used to set the window's titlebar text and icon respectively.</span>)
}, {
    title: nextCodeblockName(),
    code: `\
<Win32Dialog
    title="onFocus and onBlur example"
    x=dialogXPos
    y=dialogYPos
    width=dialogWidth
    height={250}
    onFocus={() => console.log('Window has focus!')}
    onBlur={() => console.log('Window lost its focus!')}
>
    <div
        style={{
            borderWidth: 5,
            borderStyle: 'solid',
            borderColor: 'black',
        }}
    >
    Click anywhere outside the window to make it lose focus.
    Click anywhere inside the window to make it gain focus.
    </div>
    <div
        style={{
            marginTop: 60,
            color: 'yellow'
        }}
    >
    Check the browser console to see when the callbacks are called.
    </div>
</Win32Dialog>`,
    description: (<span>The <code>onFocus</code> and <code>onBlur</code> props
can be used to pass user-defined callbacks, that will be called when the window
gains/loses focus respectively.</span>)
}, {
    title: nextDocblockName(),
    description: (<span>All <strong>Win32Dialog</strong> windows are controlled by a single
window manager that runs silently behind the scenes. The window manager handles all input
events and decides which window gets to be on top, and how windows will get stacked.</span>)
}, {
    title: nextCodeblockName(),
    code: `\
<Win32Dialog
    title="borderWidth example"
    x=dialogXPos
    y=dialogYPos
    width=dialogWidth
    height={250}
    borderWidth={40}
>
    Woah that's a big border!
</Win32Dialog>`,
    description: (<span>The <code>borderWidth</code> prop can be used to set a different
width for the window's border. The default border width is 2 pixels.</span>)
}, {
    title: nextDocblockName(),
    description: (<span>Note that if you specify a <code>borderWidth</code> other than the default,
the <code>minWidth</code> and <code>minHeight</code> props don't refer to the dimensions of the
window's outer border, but to the dimensions of the window's inner box (the area of the window
excluding the border). They adapt to larger borders, so that the window doesn't look messed up
when it's rendered.</span>)
}, {
    title: nextCodeblockName(),
    code: `\
<Win32Dialog
    title="onExit example"
    x=dialogXPos
    y=dialogYPos
    width=dialogWidth
    height={250}
    onExit={() => false}
>
    You can't close this window!
</Win32Dialog>`,
    description: (<span>The <code>onExit</code> prop can be used to set a callback that
will get called when the window's X button is clicked. If the callback returns a falsy
value, the window won't close.<br/>This can be used to prevent the user from closing the
window unless a certain condition is met.</span>)
}];


class LiveCodePreviewBlock extends Component {
    static playgroundArgs = {
        scope: {React: React, Win32Dialog: Win32Dialog},
        theme: 'ambiance',
    };

    constructor(props) {
        super(props);

        this.state = {
            codeX: 0,
            codeY: 0,
            codeWidth: 0,
        };

        this.descblockRef = React.createRef();
    }

    _setDialogRelativeDimensions() {
        if (this.descblockRef) {
            const rect = this.descblockRef.current.getBoundingClientRect();
            const halfBlock = Math.ceil(rect.width / 2),
                  dlgWidth = halfBlock - 10,
                  dlgX = halfBlock + Math.ceil(rect.left) + 2,
                  dlgY = Math.ceil(rect.bottom) + window.scrollY + 234;

            if (this.state.codeWidth < dlgWidth ||
                this.state.codeX < dlgX ||
                this.state.codeY < dlgY) {
                this.setState({
                    codeX: dlgX,
                    codeY: dlgY,
                    codeWidth: dlgWidth
                });
            }
        }
    }

    componentDidMount() {
        this._setDialogRelativeDimensions();
    }

    render() {
        let formattedCode = this.props.code.replace('dialogXPos', '{' + this.state.codeX + '}')
                                           .replace('dialogYPos', '{' + this.state.codeY + '}')
                                           .replace('dialogWidth', '{' + this.state.codeWidth + '}');

        return (
            <div className='livecodepreview-block'>
                <div
                    ref={this.descblockRef}
                    className="livecodepreview-description-block"
                >
                    {this.props.children}
                </div>
                <Playground
                    codeText={formattedCode}
                    {...LiveCodePreviewBlock.playgroundArgs}
                />
            </div>
        );
    }
}

export default class App extends Component {
    render () {
        const tutorialBlocks = win32DialogTutorial.map((block) => (block.code) ? (
                <LiveCodePreviewBlock
                    code={block.code}
                    key={block.title}
                >
                    {block.description}
                </LiveCodePreviewBlock>
            ) : (
                <div
                    key={block.title}
                    className="standalone-description-block"
                >
                    {block.description}
                </div>
            )
        );

        return (
            <div className="document-container">
                <a href="https://github.com/Gikoskos/react-win32dialog">
                    <img
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            border: 0
                        }}
                        src="https://s3.amazonaws.com/github/ribbons/forkme_left_white_ffffff.png"
                        alt="Fork me on GitHub"
                    />
                </a>
                <div className='header-block'>
                    <a href="https://github.com/Gikoskos/react-win32dialog">
                        <div className='site-logo-block'>
                            <div className='site-logo-inner-border'>
                                <div>react-win32dialog</div>
                                <span
                                    role='img'
                                    aria-label='diamond shape with a dot inside'
                                >
                                    💠
                                </span>
                            </div>
                        </div>
                    </a>
                </div>
                {tutorialBlocks}
                <div className='footer-block'>
                    <div className='footer-credits'>
                        Site created with <strong>
                        <a href='https://reactjs.org/'>React</a></strong>.
                        The live code editors are from the
                        amazing <strong><a href='https://github.com/FormidableLabs/component-playground'>
                        component-playground</a></strong>.
                        Hosted by Github pages.
                    </div>
                    <div className='footer-copyright'>
                        <span><a href='https://github.com/Gikoskos/react-win32dialog/blob/master/LICENSE'>
                        See license.</a> <a href='mailto:georgekoskerid@outlook.com'>Email me!</a></span>
                    </div>
                </div>
            </div>
        );
    }
}

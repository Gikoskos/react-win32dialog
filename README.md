<h1 align="center"><a href="https://gikoskos.github.io/react-win32dialog/">react-win32dialog</a> <br/>💠</h1>

![react-win32dialog box](https://i.imgur.com/A048mfO.png)

React component library for modeless, resizeable and moveable dialog boxes with a classic Windows look-and-feel. Comes with a light-weight window manager that supports multiple dialog boxes and stacking.

[![NPM](https://img.shields.io/npm/v/react-win32dialog.svg)](https://www.npmjs.com/package/react-win32dialog)![GitHub](https://img.shields.io/github/license/mashape/apistatus.svg)

## Install

```bash
npm install --save react-win32dialog
```


## Usage

```jsx
import React from 'react';
import Win32Dialog from 'react-win32dialog';

class Example extends React.Component {
    static blurText = "Dialog doesn't have focus!";
    static focusText = "Dialog has focus!";

    constructor(props) {
        super(props);

        this.state = {
            text: Example.blurText,
        };
    }

    _onFocus = () => {
        this.setState({
            text: Example.focusText
        });
    }

    _onBlur = () => {
        this.setState({
            text: Example.blurText
        });
    }

    render () {
        return (
            <Win32Dialog
                x={500}
                y={500}
                width={200}
                height={200}
                minWidth={150}
                minHeight={50}
                title="My first react-win32dialog box!"
                icon="myicon.jpg"
                onExit={() => true}
                onBlur={this._onBlur}
                onFocus={this._onFocus}
                >
                <div>
                    {this.state.text}
                </div>
            </Win32Dialog>
        );
    }
}
```

## Props

|   Property    |   Type   |                           Default                            |                         Description                          |
| :-----------: | :------: | :----------------------------------------------------------: | :----------------------------------------------------------: |
|      `x`      |  number  |                              1                               |              Initial x position of the dialog.               |
|      `y`      |  number  |                              1                               |              Initial y position of the dialog.               |
|    `width`    |  number  |                          `minWidth`                          |        Initial width if it's larger than `minWidth`.         |
|   `height`    |  number  |                         `minHeight`                          |       Initial height if it's larger than `minHeight`.        |
|  `minWidth`   |  number  | See [`rect.js/defaultRect`](https://github.com/Gikoskos/react-win32dialog/blob/master/src/rect.js#L9) |           Minimum width that the dialog can have.            |
|  `minHeight`  |  number  | See [`rect.js/defaultRect`](https://github.com/Gikoskos/react-win32dialog/blob/master/src/rect.js#L9) |           Minimum height that the dialog can have.           |
| `borderWidth` |  number  | See [`rect.js/defaultRect`](https://github.com/Gikoskos/react-win32dialog/blob/master/src/rect.js#L9) |             Width of the dialog's outer border.              |
|    `title`    |  string  |                    React Win32 dialog box                    |       Text that is displayed on the dialog's titlebar.       |
|    `icon`     |  string  |              `assets/default-titlebar-icon.png`              |       Icon that is displayed on the dialog's titlebar.       |
|   `onExit`    | function |                          undefined                           | Is called when the dialog's `X` button is pressed. It should return a truthy value for the dialog to exit. If it returns falsy, the X button doesn't close the dialog. |
|   `onBlur`    | function |                          undefined                           |            Is called when the dialog loses focus.            |
|   `onFocus`   | function |                          undefined                           |            Is called when the dialog gains focus.            |

All the number type props are measured in pixels.

## Contributing

If you find a bug or want to add a feature feel free to make a PR or open an Issue.

## License

 [Gikoskos](https://github.com/Gikoskos) © MIT 2018 

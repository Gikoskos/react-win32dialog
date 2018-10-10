import React, { Component } from 'react';

import Win32Dialog from 'react-win32dialog';


const thinBlackBorder = {
    borderStyle: 'solid',
    borderColor: 'black',
    borderWidth: '1px'
};

const styles = {
    internalBorder: {
        ...thinBlackBorder,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    msg1: {
        ...thinBlackBorder,
        flex: 1,
    },
    msg2: {
        ...thinBlackBorder,
        color: 'cyan',
    },
    container: {
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
    }
};

export default class App extends Component {
    static msg1 = {
        blur: 'Click this box!',
        focus: 'Box1 has focus',
    };
    static msg2 = {
        blur: 'Click this box!',
        focus: 'Box2 has focus',
    };
    static msg3 = {
        blur: 'Click this box!',
        focus: 'Box3 has focus',
    };

    constructor(props) {
        super(props);

        this.state = {
            msg1: App.msg1.blur,
            msg2: App.msg2.blur,
            msg3: App.msg3.blur,
        };
    }

    render () {
        const window1Opts = {
            width: 170,
            height: 170,
            x: 200,
            y: 300,
            onBlur: () => this.setState({msg1: App.msg1.blur}),
            onFocus: () => this.setState({msg1: App.msg1.focus}),
            title: "Win32Dialog 1"
        }, window2Opts = {
            width: 170,
            height: 170,
            x: 600,
            y: 300,
            onBlur: () => this.setState({msg2: App.msg2.blur}),
            onFocus: () => this.setState({msg2: App.msg2.focus}),
            title: "Win32Dialog 2"
        }, window3Opts = {
            width: 170,
            height: 170,
            x: 800,
            y: 300,
            onBlur: () => this.setState({msg3: App.msg3.blur}),
            onFocus: () => this.setState({msg3: App.msg3.focus}),
            title: "Win32Dialog 3"
        };

        return (
            <div style={styles.container}>
                <Win32Dialog {...window1Opts}>
                    <div style={styles.internalBorder}>
                        <div style={styles.msg1}>
                            {this.state.msg1}
                        </div>
                    </div>
                </Win32Dialog>
                <Win32Dialog {...window2Opts}>
                    <div style={styles.internalBorder}>
                        <div style={styles.msg2}>
                            {this.state.msg2}
                        </div>
                    </div>
                </Win32Dialog>
                <Win32Dialog {...window3Opts}>
                    <div style={styles.internalBorder}>
                        <div style={styles.msg3}>
                            {this.state.msg3}
                        </div>
                    </div>
                </Win32Dialog>
            </div>
        )
    }
}

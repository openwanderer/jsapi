const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        ex1: './ex1.js',
        ex2: './ex2.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
    },
    optimization: {
        minimize: false
    }
};


const path = require('path');
const webpack = require('webpack');

process.traceDeprecation = true;

module.exports = {
    entry: {
		index: 'src/index.ts',
    },
    output: {
        path: path.resolve(__dirname, 'lib/'),
        filename: '[name].min.js',
		library: 'daslog',
		libraryTarget: 'umd',
    },
    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        // TODO: revert to options object once babel-loader fully supports it.
                        query: 'presets[]=es2015'
                    },
                    'ts-loader'
                ]
            }
        ]
    },
    resolve: {
        modules: [
            __dirname,
            'node_modules'
        ],
        extensions: ['.ts','.tsx','.js'],
    },
    //TODO: separate these plugins between dev and prod.
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            mangle: false,
            output: {
                ascii_only: true
            }
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        })
    ]
}
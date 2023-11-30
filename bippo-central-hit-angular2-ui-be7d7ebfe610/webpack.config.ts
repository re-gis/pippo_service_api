const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const helpers = require('./webpackconfig/helpers')
function webpackConfig(options: EnvOptions = {}): WebpackConfig {

  return {
    // cache: false,

    entry: {
      polyfills: './src/polyfills',
      vendor:    './src/vendor',
      main:      './src/main'
    },

    output: {
      path: path.join(__dirname, '/dist'),
      filename: '[name].bundle.js',
      sourceMapFilename: '[name].map',
      chunkFilename: '[id].chunk.js'
    },

    module: {
      rules: [
        // angular2 typescript loader
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'awesome-typescript-loader?useBabel=true&useWebpackText=true'
            },
            {
              loader: 'angular2-template-loader'
            }
          ]
        },
        // html loader
        {
          test: /\.html$/,
          loader: 'raw-loader',
          exclude: [ path.join(__dirname, '/src/index.html')]
        },
        // static assets
        {
          test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
          loader: 'file-loader?name=assets/[name].[hash].[ext]'
        },
        // css loader and inject into components
        {
          test: /\.css$/,
          include: helpers.root('src', 'app'),
          loader: 'raw-loader'
        },
        // // css global which not include in components
        {
          test: /\.css$/,
          exclude: helpers.root('node_modules'),
          use: ExtractTextPlugin.extract({
            use: 'raw-loader'
          })
        },
        // SASS loader and inject into components
        {
          test: /\.scss$/,
          include: helpers.root('src', 'app'),
          use: ['raw-loader', 'sass-loader']
        },
        // // SASS global which not include in components
        {
          test: /\.scss$/,
          exclude: helpers.root('src', 'app'),
          use: ExtractTextPlugin.extract({
            use: ['raw-loader', 'sass-loader']
          })
        }
      ]
    },

    plugins: [
        new webpack.NormalModuleReplacementPlugin(/\.\/config\/environment\.dev/, './config/environment.prod'),

        new webpack.optimize.CommonsChunkPlugin({
          name: ['main', 'vendor', 'polyfills'],
          minChunks: Infinity
        }),
        new HtmlWebpackPlugin({
            template: './src/index.html'
            // filename: './index.html',
            // inject: 'body'
        }),
        new CopyWebpackPlugin([
            { from : './public/assets/', to : 'assets'} 
        ]),
        new CopyWebpackPlugin([
            { from : './public/css/', to : 'css'} 
        ]),
        new CopyWebpackPlugin([
            { from : './public/js/', to : 'js'} 
        ]),
        new CopyWebpackPlugin([
            { from : './public/html/', to : 'html'} 
        ]),
        new ExtractTextPlugin(
            '[name].css'
            // allChunks: true
        ),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.optimize.ModuleConcatenationPlugin(),
        new webpack.ContextReplacementPlugin(
            /@angular(\\|\/)core/,
            path.join(__dirname, 'src'),
            {}
        ),
        // new webpack.ProvidePlugin({
        //   jQuery: 'jquery',
        //   $: 'jquery',
        //   jquery: 'jquery'
        // }),
        new webpack.DefinePlugin({
            ENV: JSON.stringify(options.ENV),
            HMR: options.HMR
        })
    ],

    devtool: 'cheap-eval-source-map',
    resolve: {
      modules: [ path.join(__dirname, 'node_modules/'), path.join(__dirname, 'src/')],
      extensions: ['.ts', '.js']
    },

    devServer: {
      contentBase: path.join(__dirname, '/dist'),
      port: 4200,
      historyApiFallback: true
    }
  };
}

// Export
module.exports = logOptions(webpackConfig);

function logOptions(fn) {
  return function(options: EnvOptions = {}) {
    console.log('Env Options: ', JSON.stringify(options, null, 2));
    return fn(options);
  };
}

// Types
type Entry = Array<string> | Object;

type Output = Array<string> | {
  path: string,
  filename: string
};

type EnvOptions = any;

interface WebpackConfig {
  cache?: boolean;
  devtool?: string;
  entry: Entry;
  output: any;
  module?: {
    rules?: Array<any>
  },
  plugins?: Array<any>;
  resolve?: {
    extensions?: Array<string>;
    modules: Array<string>;
  },
  devServer?: {
    contentBase?: string;
    port?: number;
    historyApiFallback?: boolean;
    hot?: boolean;
  }
}


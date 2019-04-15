const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const ip = require('ip')
const vConsolePlugin = require('vconsole-webpack-plugin')

module.exports = {
    mode: 'development',
    entry: {
      app: path.resolve(__dirname, './src/index.js'),
    },
    devServer: {
      contentBase: path.join(__dirname, './public'),
      compress: true,
      port: 9000,
      hot: true,
      host: ip.address()
    },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, `./dist/`),
    },
    resolve: {
      alias: {},
      extensions: ['.js', '.mjs', '.es'],
    },
    module: {
      rules: [{
        test: /\.(js|jsx|mjs)$/,
        exclude: /node_modules/,
        use: [
            'babel-loader',
        ],
        // 强制顺序加载
        enforce: 'post'
      }, {
        test: /\.html$/,
        use: [{
            loader: 'html-loader',
            options: {
                attrs: ['img:src', 'img:data-original']
            }
        }, ]
      }, {
        test: /\.(eot|woff|woff2|svg|ttf|zip|mp3|mp4|flv|webm|ogv)$/,
        loader: 'url-loader',
        options: {
            limit: 5000
        }
      }, {
        test: /\.(css|scss)$/,
        use: [
          'style-loader?sourceMap',
          'css-loader?sourceMap',
          'postcss-loader?sourceMap',
          'sass-loader?sourceMap',
        ],
      }, {
        test: /\.(js|jsx|mjs)$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [path.resolve(__dirname, '../src')],
        options: {
          formatter: require('eslint-friendly-formatter')
        },
      }, {
        test: /\.(png|jpe?g|gif|svg)$/,
        use: [{
            // 用url-loader加载进来，phaser不支持data-uri
            loader: 'file-loader',
            options: {
                name: '[name].[ext]',
            }
        }]
      }]
    },
    plugins: [
      new HtmlWebpackPlugin({
          template: path.resolve(__dirname, `./src/index.html`),
          inlineSource: '.(js|css)$'
      }),
      new webpack.HotModuleReplacementPlugin(),
      new FriendlyErrorsPlugin(),
      // new vConsolePlugin({
      //   enable: true
      // }),
    ]
}
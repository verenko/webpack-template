const fs                            = require('fs');
const path                          = require('path');
const HTMLWebpackPlugin             = require('html-webpack-plugin');
const {CleanWebpackPlugin}          = require('clean-webpack-plugin');
const MiniCssExtractPlugin          = require('mini-css-extract-plugin');
const CopyWebpackPlugin             = require('copy-webpack-plugin');
const OptimizeCssAssetWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const TerserWebpackPlugin           = require('terser-webpack-plugin');
const ImageminPlugin                = require('imagemin-webpack');


//
const isDevelop = process.env.NODE_ENV === 'development';
const isProduction = !isDevelop;
//


const pages = fs.readdirSync('./app').filter(fileName => fileName.endsWith('.html'))



const optimization = () => {
  const configObj = {
    splitChunks: {
      chunks: 'all'
    }
  };

  if (isProduction) {
    configObj.minimizer = [
      new OptimizeCssAssetWebpackPlugin(),
      new TerserWebpackPlugin()
    ];
  }

  return configObj;
};




const plugins = () => {
  const basePlugins = [
    ...pages.map(page => new HTMLWebpackPlugin({
      template: path.resolve(__dirname, `app/${page}`),
      filename: `${page}`,
      minify: {
        collapseWhitespace: true
      }
    })),

    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: `./css/[name].min.css`
    })
  ];

  if (isProduction) {
    basePlugins.push(
      new ImageminPlugin({
        bail: false, // Ignore errors on corrupted images
        cache: true,
        imageminOptions: {
          plugins: [
            ["gifsicle", {
              interlaced: true
            }],
            ["jpegtran", {
              progressive: true
            }],
            ["optipng", {
              optimizationLevel: 5
            }],
            [
              "svgo",
              {
                plugins: [{
                  removeViewBox: false
                }]
              }
            ]
          ]
        }
      })
    )
  }

  return basePlugins;
};

module.exports = {
  context: path.resolve(__dirname, 'app'),
  mode: 'development',
  entry: './js/webpack.js',
  output: {
    filename: isDevelop ? `./js/app.[chunkhash].js` : `./js/main.min.js`,
    path: path.resolve(__dirname, 'dist'),
    publicPath: ''
  },
  devServer: {
    historyApiFallback: true,
    contentBase: path.resolve(__dirname, 'dist'),
    open: true,
    compress: true,
    hot: true,
    port: 3000,
  },
  optimization: optimization(),
  plugins: plugins(),
  devtool: isProduction ? false : 'source-map',
  module: {
    rules: [{
        test: /\.html$/,
        loader: 'html-loader',
      },
      {
        test: /\.css$/i,
        use: [{
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: isDevelop
            },
          },
          'css-loader'
        ],
      },
      {
        test: /\.s[ac]ss$/,
        use: [{
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: (resourcePath, context) => {
                return path.relative(path.dirname(resourcePath), context) + '/';
              },
            }
          },
          'css-loader',
          'sass-loader'
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.(?:|gif|png|jpg|jpeg|svg)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: `./img/[name].[ext]`
          }
        }],
      },
      {
        test: /\.(ttf|eot|svg|gif|woff|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: `./fonts/[name].[ext]`
          }
        }],
      }
    ]
  }
};

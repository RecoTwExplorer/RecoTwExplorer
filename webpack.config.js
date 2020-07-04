"use strict";

const path = require("path");
const { ProvidePlugin } = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackTagsPlugin = require("html-webpack-tags-plugin");
const ScriptExtHtmlWebpackPlugin = require("script-ext-html-webpack-plugin");
const StyleExtHtmlWebpackPlugin = require("style-ext-html-webpack-plugin");

const mode = process.env.NODE_ENV || process.env.WEBPACK_DEV_SERVER ? "development" : "production";
module.exports = {
    mode,
    devtool: mode === "production" ? "" : "eval-cheap-module-source-map",
    entry: "./src/ts/index.ts",
    output: {
        filename: "bundle.js",
        path: path.join(__dirname, "/dist"),
        publicPath: "",
    },
    module: {
        rules: [
            {
                test: /\.ts$/u,
                use: [
                    { loader: "ts-loader?transpileOnly=true" },
                ],
            },
            ...(mode === "production" ? [
                {
                    test: /\.scss$/u,
                    use: [
                        { loader: MiniCssExtractPlugin.loader },
                        { loader: "css-loader" },
                        { loader: "sass-loader" },
                    ],
                },
                {
                    test: /\.(?:ts|js)$/u,
                    enforce: "pre",
                    exclude: /node_modules/u,
                    use: [
                        { loader: "eslint-loader" },
                    ],
                },
            ] : [
                {
                    test: /\.scss$/u,
                    use: [
                        { loader: "style-loader" },
                        { loader: "css-loader" },
                        { loader: "sass-loader" },
                    ],
                },
            ]),
            {
                test: /\.(?:woff2?|ttf|eot|svg)(?:\?v=[\d.]+|\?[\s\S]+)?$/u,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            name: "[name].[ext]",
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        extensions: [
            ".ts",
            ".js",
        ],
        plugins: [
            new TsconfigPathsPlugin(),
        ],
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin(),
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin([
            {
                from: path.join(__dirname, "/images"),
                to: path.join(__dirname, "/dist/images"),
            },
        ]),
        new ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
        }),
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: "index.html",
        }),
        new HtmlWebpackTagsPlugin({
            append: false,
            tags: [
                "https://www.gstatic.com/charts/loader.js",
                "https://platform.twitter.com/widgets.js",
            ],
        }),
        ...(mode === "production" ? [
            new MiniCssExtractPlugin(),
            new StyleExtHtmlWebpackPlugin(),
            new ScriptExtHtmlWebpackPlugin({
                inline: [
                    "bundle.js",
                ],
            }),
        ] : []),
    ],
    devServer: {
        host: "0.0.0.0",
        proxy: {
            "/api": {
                target: `http://${process.env.RECOTW_API_HOST}:8080`,
                pathRewrite: {
                    "^/api": "",
                },
            },
        },
    },
};

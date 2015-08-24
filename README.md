RecoTw Explorer
===============

[![Build Status](https://travis-ci.org/RecoTwExplorer/RecoTwExplorer.svg?branch=master)](https://travis-ci.org/RecoTwExplorer/RecoTwExplorer)

RecoTw Explorer は、[@G2U](https://twitter.com/G2U) 氏作成の黒歴史ツイート記録サービス RecoTw の閲覧/登録用の Web アプリケーションです。 RecoTw に登録されているすべての情報について作者（ちとく − [@java_shit](https://twitter.com/java_shit)）は一切関知しません。詳しくはサービスの運営元へお問い合わせください。 また、このアプリケーションを使用することによって発生した損害に対して作者は一切の責任を負いかねます。

## 動作環境

Internet Explorer 9 以上、Google Chrome、Firefox 上で動作することを確認していますが、これを保障するものではありません。

## ビルド

このプロジェクトは TypeScript と SCSS を使用しているため動作の確認にはビルド作業が必要です。  
Node.js v0.10 上で `gulp` を実行することでビルドでき、その結果は `/dest/*` 以下に出力されます。

```
$ npm install
$ npm install -g gulp
$ gulp
```

## ソースコード

このアプリケーションは MIT ライセンスのもとに GitHub 上で公開されています：  
[https://github.com/RecoTwExplorer/RecoTwExplorer](https://github.com/RecoTwExplorer/RecoTwExplorer)  
バグ報告ないしプルリクエスト等はこのレポジトリにお願いいたします。

## 使用サービス

このアプリケーションは Twitter のユーザーアイコン表示のために次の Web サービスを使用しています：  
[Profile Image API For Twitter■140note](http://140note.hitonobetsu.com/apipage/profileimage)

## 使用ライブラリ

このアプリケーションは次のライブラリを使用しています：
- [jQuery](http://jquery.com/)
- [linq.js](http://linqjs.codeplex.com/)
- [Bootstrap](http://getbootstrap.com/)
- [Font Awesome](http://fortawesome.github.io/Font-Awesome/)
- [Google Charts](https://developers.google.com/chart/)
- [favico.js](http://lab.ejci.net/favico.js/)

==================================
© Chitoku 2014. Powered by RecoTw.
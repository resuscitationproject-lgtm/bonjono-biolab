# BONJONO 地域環境マップ

BONJONO自治会の清掃活動と、ひとまち公園・池の自然観察を地図で可視化する静的Webアプリです。
GitHub PagesとFirebase Firestoreで動作し、ビルド作業は不要です。

## Firebaseの準備

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成します。
2. Firestore Databaseを作成します。本番公開時は「本番環境モード」を選びます。
3. FirebaseプロジェクトにWebアプリを追加します。
4. 表示された設定値を `js/firebase-config.js` の `firebaseConfig` に貼り付けます。
5. Firestoreの「ルール」に `firestore.rules` の内容を貼り付けて公開します。
6. 写真保存を使う場合はFirebase Consoleの「Storage」からバケットを作成し、`storage.rules` の内容をStorageの「ルール」へ貼り付けて公開します。

### 写真保存に関する注意

Cloud Storage for Firebaseは現在、利用開始にBlaze（従量課金）プランの請求先登録が必要です。無料利用枠が適用される場合でも、枠を超えると課金される可能性があるため、Firebase Consoleで予算アラートを設定してください。
写真は公開マップから閲覧できる設計です。人物の顔、車のナンバー、住所などの個人情報は撮影・投稿しないでください。

## 管理者モードの準備

1. Firebase Consoleの `Authentication` を開きます。
2. `Sign-in method` で「メール / パスワード」を有効にします。
3. `Settings` の承認済みドメインへ `resuscitationproject-lgtm.github.io` を追加します。
4. `Users` から管理者用ユーザーを追加します。
5. 作成したユーザーの `User UID` を控えます。
6. Firestoreに `admins` コレクションを作り、User UIDと同じ文書IDで文書を追加します。フィールドは `enabled: true` などで構いません。
7. 更新した `firestore.rules` をFirestoreの「ルール」へ貼り付けて公開します。
8. アプリの `管理` ボタンから、追加したメールアドレスとパスワードでログインします。

管理者画面の「入力受付期間の設定」から、清掃活動と自然観察の受付開始・終了日時を設定できます。
チェックを外すか設定文書が未作成の場合は受付停止となり、住民画面は閲覧のみになります。
受付期間の判定はFirestoreのサーバー時刻でも行われるため、端末時刻の変更では回避できません。

管理者モードでは次の操作ができます。

- 全報告データのCSV出力
- 選択日のCSV出力
- 選択日の件数、ゴミ量合計、平均、5段階内訳の集計
- 日次レポートの印刷およびPDF保存

FirebaseのWeb設定値は公開される前提の識別情報です。実際のアクセス制御は
Firestore Security Rulesで行うため、テストモードのまま公開しないでください。

## ローカル確認

位置情報は安全な接続（HTTPS）または `localhost` でのみ利用できます。ファイルを直接開かず、
このフォルダをローカルWebサーバーで配信してください。

```sh
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` を開きます。

## GitHub Pagesで公開

保存先リポジトリ：
[resuscitationproject-lgtm/bonjono-biolab](https://github.com/resuscitationproject-lgtm/bonjono-biolab)

公開予定URL：
https://resuscitationproject-lgtm.github.io/bonjono-biolab/

1. このフォルダの内容を上記GitHubリポジトリへ追加します。
2. リポジトリの `Settings` > `Pages` を開きます。
3. `Deploy from a branch` を選択し、公開ブランチと `/ (root)` を指定します。
4. 表示されたHTTPSのURLへアクセスします。

## ファイル構成

```text
.
├── index.html
├── input.html
├── nature-input.html
├── admin.html
├── firestore.rules
├── storage.rules
├── assets/
│   └── kitakyushu-it-club-logo.png
└── js/
    ├── firebase-config.js
    ├── app.js
    ├── admin.js
    ├── input.js
    ├── nature-input.js
    └── input-policy.js
```

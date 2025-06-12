# マルチステージビルド - ビルド段階
FROM node:20-slim AS builder

WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./
COPY tsconfig.json ./

# すべての依存関係をインストール
RUN npm ci

# ソースコードをコピー
COPY src ./src

# TypeScriptをコンパイル
RUN npm run build

# ビルド後のdistフォルダを確認
RUN ls -la dist/

# 実行段階
FROM node:20-slim

WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# production依存関係のみをインストール
RUN npm ci --only=production

# ビルド段階からコンパイル済みのJSをコピー
COPY --from=builder /app/dist ./dist

# TypeScript設定ファイルをコピー
COPY tsconfig.json ./
COPY tsconfig-paths-bootstrap.js ./

# ポート8080を開放
EXPOSE 8080

# アプリケーションを起動
CMD ["npm", "run", "start"]
#!/bin/bash

# 特定ユーザーのデータをバックアップしてからマイグレーションを実行するスクリプト
# 使用方法: ./backup-and-migrate.sh metavicer@gmail.com

EMAIL=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${EMAIL}_${TIMESTAMP}.sql"

if [ -z "$EMAIL" ]; then
    echo "使用方法: ./backup-and-migrate.sh <email>"
    exit 1
fi

echo "=== バックアップ & マイグレーション ==="
echo "対象: $EMAIL"
echo "バックアップファイル: $BACKUP_FILE"
echo ""

# 環境変数の読み込み
source ../.env

# 1. 対象ユーザーのデータをバックアップ
echo "📦 バックアップ作成中..."

pg_dump \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    --data-only \
    --inserts \
    --column-inserts \
    -t "users" \
    -t "partners" \
    -t "relationship_metrics" \
    -t "messages" \
    -t "memories" \
    --where="users.email='$EMAIL'" \
    > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ バックアップ完了: $BACKUP_FILE"
else
    echo "❌ バックアップ失敗"
    exit 1
fi

# 2. バックアップファイルのサイズ確認
FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
echo "📊 バックアップサイズ: $FILE_SIZE"

# 3. マイグレーション実行
echo ""
echo "🔄 マイグレーション実行..."
cd ..
npm run migrate:individual -- "$EMAIL"

echo ""
echo "=== 完了 ==="
echo "バックアップファイル: scripts/$BACKUP_FILE"
echo "復元が必要な場合: psql -h $DB_HOST -U $DB_USER -d $DB_NAME < scripts/$BACKUP_FILE"
#!/bin/bash

DIRNAME=$(dirname $0)
TERCOM_JAR=~/Libraries/tercom-0.7.25/tercom.7.25.jar

if [ $# -lt 1 ]
then
    echo "Usage: bash prepareDataset.sh DUMP_FILENAME" 1>&2
    exit 1
fi

DUMP_FILE=$1
OUT_DIR=$(dirname $1)/$(basename $1 .dump)

mkdir -p $OUT_DIR

echo "==> Running $DIRNAME/prepareDataset.js <=="
js "$DIRNAME/prepareDataset.js" "$DUMP_FILE" "$OUT_DIR"

echo "==> Computing HTER scores <=="
java -jar "$TERCOM_JAR" -h "$OUT_DIR/sentences.mt.tok" -r "$OUT_DIR/sentences.pe.tok" -o ter -n "$OUT_DIR/sentences.hter" > /dev/null

paste <(echo hter; tail -n +3 "$OUT_DIR/sentences.hter.ter" | awk '{print $4}') <(cat "$OUT_DIR/sentences.time") > "$OUT_DIR/sentences.params"
rm "$OUT_DIR/sentences.hter.ter" "$OUT_DIR/sentences.time"

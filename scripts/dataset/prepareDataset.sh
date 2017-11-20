#!/bin/bash

DIRNAME=$(dirname $0)
TERCOM_JAR=~/Libraries/tercom-0.7.25/tercom.7.25.jar

if [ $# -lt 3 ]
then
    echo "Usage: bash prepareDataset.sh DUMP_FILENAME OUT_DIR OUT_PREFIX" 1>&2
    exit 1
fi

DUMP_FILE=$1
OUT_DIR=$2
OUT_PREFIX=$3

echo "==> Running $DIRNAME/prepareDataset.js <=="
js "$DIRNAME/prepareDataset.js" "$DUMP_FILE" "$OUT_DIR" "$OUT_PREFIX"

echo "==> Computing HTER scores <=="
java -jar "$TERCOM_JAR" -h "$OUT_DIR/$OUT_PREFIX.mt.tok" -r "$OUT_DIR/$OUT_PREFIX.pe.tok" -o ter -n "$OUT_DIR/$OUT_PREFIX.hter" > /dev/null

paste <(echo hter; tail -n +3 "$OUT_DIR/$OUT_PREFIX.hter.ter" | awk '{print $4}') <(cat $OUT_DIR/$OUT_PREFIX.time) > "$OUT_DIR/$OUT_PREFIX.params"
rm "$OUT_DIR/$OUT_PREFIX.hter.ter" "$OUT_DIR/$OUT_PREFIX.time"

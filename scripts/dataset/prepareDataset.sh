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

echo "==> Computing BLEU scores <=="
python > "$OUT_DIR/sentences.bleu" <<END
from nltk.translate import bleu_score

with open("$OUT_DIR/sentences.mt.tok") as hyp_file:
    with open("$OUT_DIR/sentences.pe.tok") as ref_file:
        for ref, hyp in zip([_.split() for _ in list(ref_file)], [_.split() for _ in list(hyp_file)]):
            print bleu_score.sentence_bleu([ref], hyp, smoothing_function=bleu_score.SmoothingFunction().method1)
END

echo "==> Finalizing <=="
paste \
    <(echo hter; tail -n +3 "$OUT_DIR/sentences.hter.ter" | awk '{print $4}') \
    <(echo bleu; cat "$OUT_DIR/sentences.bleu") \
    <(cat "$OUT_DIR/sentences.time") \
    > "$OUT_DIR/sentences.params"

rm "$OUT_DIR/sentences.hter.ter" "$OUT_DIR/sentences.bleu" "$OUT_DIR/sentences.time"

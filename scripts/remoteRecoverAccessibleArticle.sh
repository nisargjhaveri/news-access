#!/bin/bash

if [ $# -lt 3 ]
then
    echo "Usage: bash remoteRecoverAccessibleArticle.sh hostname recovery_username recovery_file" 1>&2
    exit
fi

server=$1
scriptsPath="~/Projects/news-access/scripts"

username=$2

filepath=$3
filename=$(basename $3)

scp $filepath $server:/tmp/$filename
ssh $server <<END
cd $scriptsPath
js recoverAccessibleArticle.js /tmp/$filename $username
rm /tmp/$filename
END

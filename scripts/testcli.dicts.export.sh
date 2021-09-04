#! /bin/bash 
###########################################
#
###########################################

# constants
baseDir=$(cd `dirname "$0"`;pwd)
export PYTHONUNBUFFERED=1
export PATH=/opt/miniconda3/envs/venv-py3/bin:$PATH

# functions

# main 
[ -z "${BASH_SOURCE[0]}" -o "${BASH_SOURCE[0]}" = "$0" ] || return
cd $baseDir/..


if [ ! -d ./tmp ]; then
    mkdir ./tmp
fi

OUTPUT_FILE=./tmp/bot.dicts.json

if [ -f $OUTPUT_FILE ]; then
    rm -rf $OUTPUT_FILE
fi

DEBUG=chatopera:sdk:cli ./bin/bot.js dicts --action export --filepath $OUTPUT_FILE

#! /bin/bash 
###########################################
#
###########################################

# constants
baseDir=$(cd `dirname "$0"`;pwd)
cwdDir=$PWD
export PYTHONNOUSERSITE=1
export PYTHONUNBUFFERED=1
#export PATH=/opt/miniconda3/envs/venv-py3/bin:$PATH
export TS=$(date +%Y%m%d%H%M%S)
export DATE=`date "+%Y%m%d"`
export DATE_WITH_TIME=`date "+%Y%m%d-%H%M%S"` #add %3N as we want millisecond too
export PRJ_NEW=tmp/projectnew
# functions

# main 
[ -z "${BASH_SOURCE[0]}" -o "${BASH_SOURCE[0]}" = "$0" ] || return

export NODE_HOME=/opt/node/24
export PATH=$NODE_HOME/bin:$PATH


cd $baseDir/..
if [ -d $PRJ_NEW/.cde ]; then
    rm -rf $PRJ_NEW/.cde
fi

mkdir -p $PRJ_NEW
cd $PRJ_NEW

rm -rf .env
# export CHATOPERA_BOT_ENVFILE=`pwd`/.env
# touch .env
# echo "BOT_CLIENT_ID=xx" > .env

echo "ss" > plugin.js

export DEBUG=chatopera:sdk:*
../../bin/bot.js project -a create \
    --name coi \
    --lang zh_CN
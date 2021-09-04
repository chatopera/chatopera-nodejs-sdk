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
./scripts/testcli.dicts.export.sh && \
./scripts/testcli.dicts.import.sh && \
./scripts/testcli.faq.export.sh && \
./scripts/testcli.faq.import.sh && \
./scripts/testcli.intents.export.sh && \
./scripts/testcli.intents.import.sh && \
./scripts/testcli.intents.train.sh && \
./scripts/testcli.conversation.export.sh && \
./scripts/testcli.conversation.import.sh && \
./scripts/testcli.dicts.sync.sh
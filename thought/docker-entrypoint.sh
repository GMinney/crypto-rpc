#!/bin/bash
set -e

if [[ "$1" == "thought-cli" || "$1" == "thought-tx" || "$1" == "thoughtd" || "$1" == "test_thought" ]]; then
	mkdir -p "$THOUGHT_DATA"

	CONFIG_PREFIX=""
    if [[ "${THOUGHT_NETWORK}" == "regtest" ]]; then
        CONFIG_PREFIX=$'regtest=1\n[regtest]'
    fi
    if [[ "${THOUGHT_NETWORK}" == "testnet" ]]; then
        CONFIG_PREFIX=$'testnet=1\n[test]'
    fi
    if [[ "${THOUGHT_NETWORK}" == "mainnet" ]]; then
        CONFIG_PREFIX=$'mainnet=1\n[main]'
    fi

	cat <<-EOF > "$THOUGHT_DATA/thought.conf"
	${CONFIG_PREFIX}
	printtoconsole=1
	rpcallowip=::/0
	${THOUGHT_EXTRA_ARGS}
	EOF
	chown thought:thought "$THOUGHT_DATA/thought.conf"

	# ensure correct ownership and linking of data directory
	# we do not update group ownership here, in case users want to mount
	# a host directory and still retain access to it
	chown -R thought "$THOUGHT_DATA"
	ln -sfn "$THOUGHT_DATA" /home/thought/.thoughtcore
	chown -h thought:thought /home/thought/.thoughtcore

	exec gosu thought "$@"
else
	exec "$@"
fi
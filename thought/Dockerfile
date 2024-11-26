# Builder image
FROM debian:stable-slim as builder

RUN set -ex \
	&& apt-get update \
	&& apt-get install -qq --no-install-recommends ca-certificates dirmngr gosu gpg wget

ENV THOUGHT_VERSION 0.18.3
ENV THOUGHT_URL https://github.com/thoughtnetwork/thought-wallet/raw/master/linux/thought-0.18.3/thoughtcore-0.18.3-x86_64-pc-linux-gnu.tar.gz

# install thought binaries
RUN set -ex \
	&& cd /tmp \
	&& wget -qO "thought-$THOUGHT_VERSION.tar.gz" "$THOUGHT_URL" \
	&& mkdir bin \
	&& tar -xzvf "thought-$THOUGHT_VERSION.tar.gz" -C /tmp/bin --strip-components=2 "thoughtcore/bin/thought-cli" "thoughtcore/bin/thoughtd" \
	&& cd bin \
	&& wget -qO gosu "https://github.com/tianon/gosu/releases/download/1.11/gosu-amd64" \
	&& echo "0b843df6d86e270c5b0f5cbd3c326a04e18f4b7f9b8457fa497b0454c4b138d7 gosu" | sha256sum -c -



# Final image
FROM debian:stable-slim

COPY --from=builder "/tmp/bin" /usr/local/bin

RUN chmod +x /usr/local/bin/gosu && groupadd -r thought && useradd -r -m -g thought thought

# create data directory
ENV THOUGHT_DATA /data

RUN mkdir "$THOUGHT_DATA" \
	&& chown -R thought:thought "$THOUGHT_DATA" \
	&& ln -sfn "$THOUGHT_DATA" /home/thought/.thoughtcore \
	&& chown -h thought:thought /home/thought/.thoughtcore

VOLUME /data

COPY docker-entrypoint.sh /entrypoint.sh

# Make the script executable
RUN chmod +x entrypoint.sh

# Define the entrypoint for the application, aka our startup script to choose the
# binary to run, and populate the appropriate configuration files
ENTRYPOINT ["/entrypoint.sh"]

EXPOSE 10617 10618 11617 11618
CMD ["thoughtd"]
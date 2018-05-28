FROM node:8
ENV NETWORK_TYPE DEFAULT_NETWORK_TYPE
ENV NPM_CONFIG_LOGLEVEL warn
ARG RELEASE=latest
ARG GITHUB_API_KEY=123

RUN apt update && \
    apt install -y python make g++ git build-essential && \
    npm install -g pm2@2.7.1 && \
    mkdir /app
WORKDIR /app

RUN npm install -g chronobank-middleware --unsafe
RUN mkdir src && cd src && \
    dmt init && \
    dmt install middleware-eth-blockprocessor"#$RELEASE" \
    middleware-eth-chrono-sc-processor"#$RELEASE" \
    middleware-eth-balance-processor"#$RELEASE" \
    middleware-eth-ipfs"#$RELEASE" \
    middleware-eth-erc20"#$RELEASE" \
    middleware-eth-rest"#$RELEASE" \
    middleware-eth-sidechain"#$RELEASE" \
    middleware-eth-nem-action-processor"#$RELEASE"
EXPOSE 8081
EXPOSE 8080
CMD pm2-docker start /mnt/config/${NETWORK_TYPE}/ecosystem.config.js
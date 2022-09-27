FROM ubuntu:latest

MAINTAINER Eric Löffler <eloeffler@aservo.com>

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get -y upgrade && \
    apt-get -y --no-install-recommends install \
        ca-certificates \
        curl \
        jq \
        nodejs \
        npm \
        && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN npm cache clean -f && \
    npm install -g n && \
    n stable

ADD ca_certs/ /usr/local/share/ca-certificates/
ADD dist/ /opt/app/dist/
ADD docker-entrypoint.sh /opt/app/
ADD docker-start.sh /opt/app/

RUN chmod -R 644 /usr/local/share/ca-certificates/ && \
    update-ca-certificates

RUN groupadd -r -g 1000 appuser && \
    useradd -r -g 1000 -u 1000 appuser && \
    chown -R appuser:appuser /opt/app

WORKDIR /opt/app

USER appuser

ENTRYPOINT ["/opt/app/docker-entrypoint.sh"]

CMD ["/opt/app/docker-start.sh"]

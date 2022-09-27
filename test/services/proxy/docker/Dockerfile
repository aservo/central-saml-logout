FROM ubuntu:latest

ENV DEBIAN_FRONTEND=noninteractive

RUN \
    apt-get update && \
    apt-get -y upgrade && \
    apt-get -y install \
        apache2 \
        nginx \
        && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

ADD init.sh /opt/
ADD start.sh /opt/
ADD proxy.conf.apache2.txt /etc/apache2/sites-available/proxy.conf
ADD proxy.conf.nginx.txt /etc/nginx/sites-available/proxy.conf

RUN \
    a2enmod headers && \
    a2enmod proxy && \
    a2enmod proxy_http && \
    a2enmod rewrite

RUN \
    unlink /etc/apache2/sites-enabled/000-default.conf && \
    unlink /etc/nginx/sites-enabled/default && \
    ln -s /etc/apache2/sites-available/proxy.conf /etc/apache2/sites-enabled/proxy.conf && \
    ln -s /etc/nginx/sites-available/proxy.conf /etc/nginx/sites-enabled/proxy.conf && \
    sed -i 's/^/#/' /etc/apache2/ports.conf

WORKDIR /opt

ENTRYPOINT ["/opt/init.sh"]

CMD ["/opt/start.sh"]

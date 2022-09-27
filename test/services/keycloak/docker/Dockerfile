FROM quay.io/keycloak/keycloak:latest

ADD init.sh /root/
ADD start.sh /root/
ADD realms/ /root/realms/
ADD providers/ /opt/keycloak/providers/
ADD themes/ /opt/keycloak/themes/

ENTRYPOINT ["/root/init.sh"]

CMD ["/root/start.sh"]

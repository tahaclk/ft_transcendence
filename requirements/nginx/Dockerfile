FROM debian:buster

RUN apt-get update && apt-get install -y nginx openssl

RUN mkdir /etc/nginx/ssl

COPY ./conf/nginx.conf /etc/nginx/sites-enabled/default
COPY ./tools/nginx_start.sh /var/www

ENV SERVER_NAME=${SERVER_NAME}

RUN chmod +x /var/www/nginx_start.sh
RUN mkdir -p /run/nginx

ENTRYPOINT [ "var/www/nginx_start.sh" ]

EXPOSE 8000
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]

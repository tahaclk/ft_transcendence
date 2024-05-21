FROM debian:latest

RUN mkdir -p /home/tcelik/django
WORKDIR /home/tcelik/django

RUN apt-get update && apt-get upgrade && apt-get install -y python3 python3-pip python3-venv openssl redis-server

RUN openssl req -x509 -nodes -days 365 -newkey rsa:4096 -keyout /home/tcelik/django/private.key -out /home/tcelik/django/certificate.crt -subj "/C=TR/ST=ISTANBUL/L=SARIYER/O=42Istanbul/CN=tcelik.42.fr";

COPY ./req.txt /home/tcelik/django
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip3 install -r /home/tcelik/django/req.txt

COPY ./ft_transcendence /home/tcelik/django
COPY ./script.sh /home/tcelik/django

CMD ["tail", "-f", "/dev/null"]
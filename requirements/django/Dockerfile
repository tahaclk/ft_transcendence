FROM debian:latest

RUN mkdir -p /home/tcelik/django
WORKDIR /home/tcelik/django

RUN apt-get update && apt-get upgrade && apt-get install -y python3 python3-pip python3-venv redis-server

COPY ./req.txt /home/tcelik/django
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip3 install -r /home/tcelik/django/req.txt

COPY ./ft_transcendence /home/tcelik/django

COPY ./medias /vol/medias
COPY ./static /vol/static
COPY ./script.sh /home/tcelik/django

EXPOSE 8000
EXPOSE 3000

CMD ["bash", "script.sh"]

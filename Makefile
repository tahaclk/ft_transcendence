DC := docker-compose -f docker-compose.yml

all:
	@mkdir -p /home/tcelik/data/postgresql
	@mkdir -p /home/tcelik/data/django
	@$(DC) up -d --build

down:
	@$(DC) down;

re: clean all

clean:
	@$(DC) down -v --remove-orphans
	@if [ "$$(docker images -q | wc -l)" -gt 0 ]; then docker rmi -f $$(docker images -q); fi

.PHONY: all down re clean
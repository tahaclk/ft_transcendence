python3 manage.py makemigrations userManageApp
python3 manage.py migrate
python3 manage.py collectstatic --noinput
redis-server &
python3 manage.py runserver 0.0.0.0:8000 &
daphne -b 0.0.0.0 -p 3000 ft_transcendence.asgi:application;

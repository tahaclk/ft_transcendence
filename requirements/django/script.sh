python3 manage.py makemigrations userManageApp
python3 manage.py migrate
redis-server &
python3 manage.py runsslserver 0.0.0.0:8000 --certificate ./certificate.crt --key ./private.key &
python3 manage.py runserver 0.0.0.0:8080 &
daphne -e ssl:3000:privateKey=./private.key:certKey=./certificate.crt ft_transcendence.asgi:application;

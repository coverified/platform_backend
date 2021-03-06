ARGS = $(filter-out $@,$(MAKECMDGOALS))
MAKEFLAGS += --silent

#############################
# ENVIRONMENT
#############################
-include app/.docker-base/.env
-include .env
export


#############################
# INITIALIZATION
#############################

load:
	make _load-env


#############################
# LOAD WITH ENVIROMENT
#############################
_load-env:
	[[ -d "app" ]] || bash ./.utils/load.sh


#############################
# CONTAINER ACCESS
#############################

up:
	echo ""
	bash ./.utils/message.sh info "Starting your project..."
	make check-proxy
	docker-compose up -d
	make prepare-db
	make urls

stop:
	bash ./.utils/message.sh info "Stopping your project..."
	docker-compose stop

destroy:
	make stop
	sleep 10
	bash ./.utils/message.sh info "Deleting all containers..."
	docker-compose down --rmi all --volumes --remove-orphans

upgrade:
	bash ./.utils/message.sh info "Upgrading your project..."
	docker-compose pull
	docker-compose build --pull --parallel
	make up

restart:
	make stop
	make up

rebuild:
	make destroy
	make init


#############################
# CONTAINER ACCESS
#############################

ssh:
	docker-compose exec $(ARGS) sh

run-ssh:
	docker-compose run $(ARGS) sh

init:
	[[ -f .env ]] || cp .env.example .env
	make run-yarn
	make up
	sleep 10
	make init-db
	sleep 1
	make restart
	make logs app

run-yarn:
	docker-compose run app yarn $(ARGS)

keystone:
	docker-compose exec app yarn keystone:dev $(ARGS)

prepare-db:
	docker-compose exec db psql -U $$DB_USER -d $$DB_NAME -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

init-db: prepare-db
	docker-compose exec app yarn create-tables

backup-db:
	docker-compose exec db pg_dump --clean --no-acl --format=plain --no-owner --username=$$DB_USER $$DB_NAME > dump.sql

restore-db:
	cat dump.sql | docker-compose exec -T db psql --username=$$DB_USER $$DB_NAME

clear-db:
	docker-compose exec db psql -U $$DB_USER -d $$DB_NAME -c "DROP SCHEMA public CASCADE;"
	docker-compose exec db psql -U $$DB_USER -d $$DB_NAME -c "CREATE SCHEMA public;"

rebuild-db: up clear-db init-db restart


#############################
# INFORMATION
#############################

urls:
	bash ./.utils/message.sh headline "You can access your project at the following URLS:"
	bash ./.utils/message.sh link "Frontend:    http://${PROJECT_NAME}.docker/"
	bash ./.utils/message.sh link "Backend:     http://${PROJECT_NAME}.docker/admin"
	bash ./.utils/message.sh link "GraphQL:     http://${PROJECT_NAME}.docker/admin/graphiql"
	bash ./.utils/message.sh link "Mailhog:     http://mail.${PROJECT_NAME}.docker/"
	echo ""

state:
	docker-compose ps

logs:
	docker-compose logs -f --tail=50 $(ARGS)

check-proxy:
	bash ./.utils/check-proxy.sh


#############################
# Argument fix workaround
#############################
%:
	@:

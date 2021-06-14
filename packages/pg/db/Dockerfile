FROM postgres

# Custom initialization scripts
COPY ./db/create_db.sh /docker-entrypoint-initdb.d/20-create_db.sh
COPY ./schema/schema_no_partitions.sql /schema.sql

RUN chmod +x /docker-entrypoint-initdb.d/20-create_db.sh
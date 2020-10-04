FROM postgres

# Custom initialization scripts
COPY ./create_db.sh /docker-entrypoint-initdb.d/20-create_db.sh
COPY schema_no_partitions.sql /schema.sql

RUN chmod +x /docker-entrypoint-initdb.d/20-create_db.sh
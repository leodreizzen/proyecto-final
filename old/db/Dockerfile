FROM postgres:17.6

# install dependencies
RUN apt-get update && \
    apt-get install -y postgresql-server-dev-17 build-essential git && \
    rm -rf /var/lib/apt/lists/*

# install pgvector
RUN git clone https://github.com/pgvector/pgvector.git /tmp/pgvector && \
    cd /tmp/pgvector && \
    make && make install && \
    rm -rf /tmp/pgvector

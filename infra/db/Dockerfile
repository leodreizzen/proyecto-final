FROM postgres:18.1

# install dependencies
FROM postgres:18.1

RUN apt-get update && \
    \
    apt-get install -y postgresql-server-dev-18 build-essential git && \
    \
    git clone https://github.com/pgvector/pgvector.git /tmp/pgvector && \
    cd /tmp/pgvector && \
    make && make install && \
    \
    cd / && \
    rm -rf /tmp/pgvector && \
    apt-get remove -y postgresql-server-dev-18 build-essential git && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*
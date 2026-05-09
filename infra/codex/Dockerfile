FROM python:3.12-slim

ARG USERNAME=codex
ARG USER_UID=1000
ARG USER_GID=1000

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      bash \
      bash-completion \
      build-essential \
      ca-certificates \
      curl \
      fd-find \
      git \
      gnupg \
      jq \
      less \
      nano \
      openssh-client \
      pkg-config \
      postgresql-client \
      ripgrep \
      sudo \
      unzip \
      xz-utils \
      zip && \
    install -d -m 0755 /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | \
      gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > \
      /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends nodejs && \
    npm install -g @openai/codex && \
    python -m pip install --no-cache-dir --upgrade pip uv && \
    groupadd --gid "${USER_GID}" "${USERNAME}" && \
    useradd --uid "${USER_UID}" --gid "${USER_GID}" --create-home --shell /bin/bash "${USERNAME}" && \
    echo "${USERNAME} ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/${USERNAME}" && \
    chmod 0440 "/etc/sudoers.d/${USERNAME}" && \
    mkdir -p /workspace "/home/${USERNAME}/.codex" "/home/${USERNAME}/.cache" && \
    chown -R "${USERNAME}:${USERNAME}" /workspace "/home/${USERNAME}" && \
    rm -rf /var/lib/apt/lists/*

ENV HOME=/home/codex \
    CODEX_HOME=/home/codex/.codex \
    XDG_CACHE_HOME=/home/codex/.cache \
    UV_CACHE_DIR=/home/codex/.cache/uv \
    npm_config_cache=/home/codex/.cache/npm \
    PYTHONUNBUFFERED=1

USER codex
WORKDIR /workspace

CMD ["codex", "--sandbox", "danger-full-access"]

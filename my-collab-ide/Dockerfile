FROM ubuntu:22.04

# 设置环境变量避免交互式提示
ENV DEBIAN_FRONTEND=noninteractive

# 安装 nginx 和所需的编程环境
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    nodejs \
    npm \
    nginx \
    build-essential \
    python3 \
    python3-pip \
    openjdk-17-jdk \
    curl \
    git \
    nano \
    vim \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 创建用于代码编译和运行的目录
RUN mkdir -p /workspace

# 删除默认的Nginx欢迎页
RUN rm -rf /var/www/html/*
RUN ls -la /var/www/html

# 复制构建好的前端文件到 nginx 目录
COPY ./dist/ /var/www/html/
RUN echo "Files copied to /var/www/html:" && ls -la /var/www/html

# 复制自定义 nginx 配置
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
RUN echo "Nginx configuration:" && cat /etc/nginx/conf.d/default.conf

# 配置默认站点以使用我们的配置
RUN echo "include /etc/nginx/conf.d/*.conf;" > /etc/nginx/sites-enabled/default

# 暴露 80 端口
EXPOSE 80

# 复制前后端文件
COPY ./server/ /app/server/

# 安装后端依赖
WORKDIR /app/server
RUN npm install

# 创建启动脚本
RUN echo '#!/bin/bash\n\
    echo "Starting Nginx..."\n\
    nginx -t\n\
    service nginx start\n\
    echo "Nginx started!"\n\
    echo "Starting Node.js server..."\n\
    cd /app/server && node index.js &\n\
    echo "Node.js server started!"\n\
    echo "Content of /var/www/html:"\n\
    ls -la /var/www/html\n\
    echo "Watching logs..."\n\
    tail -f /var/log/nginx/access.log /var/log/nginx/error.log\n' > /start.sh && \
    chmod +x /start.sh

# 设置默认命令
CMD ["/bin/bash", "/start.sh"]

# --- 如何使用 ---
# 1. 构建镜像:
#    docker build -t multi-lang-builder .
#
# 2. 运行容器并挂载你的项目目录:
#    docker run -it --rm -v "$(pwd):/app" multi-lang-builder bash
#
# 3. 在容器内编译:
#    cd /app
#    gcc my_program.c -o my_program       # 编译 C
#    g++ my_program.cpp -o my_program   # 编译 C++
#    javac MyProgram.java                 # 编译 Java
#    python3 my_script.py                 # 运行 Python (通常不需要显式编译)
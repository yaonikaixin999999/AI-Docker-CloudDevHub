FROM ubuntu:22.04

# 设置环境变量避免交互式提示
ENV DEBIAN_FRONTEND=noninteractive

# 更换为国内软件源
RUN sed -i 's/archive.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list && \
    sed -i 's/security.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list

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
    openssh-server \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 创建用于代码编译和运行的目录
RUN mkdir -p /workspace /data/My_Desktop/User_Coding

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

# 暴露端口（添加 3001 端口用于 WebSocket）
EXPOSE 80 3001

# 复制前后端文件
COPY ./server/ /app/server/

# 安装后端依赖
WORKDIR /app/server
RUN npm install

# 创建默认的环境配置
RUN echo 'SSH_HOST=localhost\n\
    SSH_USERNAME=root\n\
    SSH_PASSWORD=password\n\
    BASE_DIR=/data/My_Desktop/User_Coding\n\
    PORT=3001' > .env

# 配置SSH服务器（如果使用SSH模式）
RUN echo 'root:password' | chpasswd && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

# 创建启动脚本（修改以支持协作功能和SSH服务）
RUN echo '#!/bin/bash\n\
    echo "Starting AI Collaborative IDE..."\n\
    \n\
    # 启动SSH服务（如果需要）\n\
    echo "Starting SSH service..."\n\
    service ssh start\n\
    \n\
    # 创建一些示例文件\n\
    mkdir -p /data/My_Desktop/User_Coding/examples\n\
    echo "int main() { return 0; }" > /data/My_Desktop/User_Coding/examples/hello.c\n\
    echo "print(\"Hello World\")" > /data/My_Desktop/User_Coding/examples/hello.py\n\
    \n\
    echo "Testing Nginx configuration..."\n\
    nginx -t\n\
    echo "Starting Nginx..."\n\
    service nginx start\n\
    echo "Nginx started!"\n\
    echo "Starting Node.js server with collaboration support..."\n\
    cd /app/server && node index.js &\n\
    echo "Node.js server started!"\n\
    echo "Services running:"\n\
    echo "- Frontend: http://localhost:80"\n\
    echo "- Backend API: http://localhost:80/api"\n\
    echo "- WebSocket: ws://localhost:3001"\n\
    echo "Content of /var/www/html:"\n\
    ls -la /var/www/html\n\
    echo "Files in workspace:"\n\
    ls -la /data/My_Desktop/User_Coding\n\
    echo "Watching logs..."\n\
    tail -f /var/log/nginx/access.log /var/log/nginx/error.log\n' > /start.sh && \
    chmod +x /start.sh

# 设置默认命令
CMD ["/bin/bash", "/start.sh"]

# --- 如何使用 ---
# 1. 构建镜像:
#    docker build -t ai-collab-ide .
#
# 2. 运行容器:
#    docker run -d --name ai-collab-ide -p 80:80 -p 3001:3001 -v "$(pwd)/workspace:/data/My_Desktop/User_Coding" ai-collab-ide
#
# 3. 查看日志:
#    docker logs -f ai-collab-ide
#
# 4. 停止容器:
#    docker stop ai-collab-ide && docker rm ai-collab-ide
#
# 3. 在容器内编译:
#    cd /app
#    gcc my_program.c -o my_program       # 编译 C
#    g++ my_program.cpp -o my_program   # 编译 C++
#    javac MyProgram.java                 # 编译 Java
#    python3 my_script.py                 # 运行 Python (通常不需要显式编译)
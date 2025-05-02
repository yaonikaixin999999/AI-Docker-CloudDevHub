# 使用一个通用的 Linux 发行版作为基础镜像，例如 Ubuntu LTS
FROM ubuntu/nginx:1.24-24.04_beta

# 设置环境变量，避免安装过程中的交互式提示
ENV DEBIAN_FRONTEND=noninteractive

# 更新包列表并安装所需的编译器和运行时
# - build-essential: 包含 C/C++ 编译器 (gcc, g++) 和 make 等工具
# - python3: Python 3 解释器
# - python3-pip: Python 包安装器
# - openjdk-17-jdk: Java 开发工具包 (你可以选择其他版本，如 openjdk-11-jdk)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    python3-pip \
    openjdk-21-jdk \
    # 清理 apt 缓存以减小镜像体积
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# (可选) 将你的代码复制到镜像中。
# 如果你更倾向于在运行时挂载代码目录，可以注释掉下面这行。
# COPY . /app

# (可选) 设置默认命令。例如，启动一个 bash shell 方便交互。
# 如果不设置，容器启动后会立即退出，除非你在 'docker run' 时指定命令。
# CMD ["bash"]

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
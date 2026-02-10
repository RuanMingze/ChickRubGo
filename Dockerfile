FROM nginx:alpine

# 设置工作目录
WORKDIR /usr/share/nginx/html

# 复制项目文件到Nginx目录
COPY . /usr/share/nginx/html/

# 复制自定义Nginx配置文件
COPY nginx/error-handling.conf /etc/nginx/conf.d/error-handling.conf

# 创建必要的目录
RUN mkdir -p /var/log/nginx /var/tmp/nginx /var/cache/nginx/client_body /var/cache/nginx/proxy /var/cache/nginx/fastcgi /var/cache/nginx/uwsgi /var/cache/nginx/scgi

# 创建自定义Nginx配置文件
RUN echo 'worker_processes 1;\
events {\
    worker_connections 1024;\
}\
http {\
    include /etc/nginx/mime.types;\
    default_type application/octet-stream;\
    sendfile on;\
    keepalive_timeout 65;\
    client_body_temp_path /var/cache/nginx/client_body;\
    proxy_temp_path /var/cache/nginx/proxy;\
    fastcgi_temp_path /var/cache/nginx/fastcgi;\
    uwsgi_temp_path /var/cache/nginx/uwsgi;\
    scgi_temp_path /var/cache/nginx/scgi;\
    server {\
        listen 8080;\
        server_name localhost ruanmingze.github.io;\
        root /usr/share/nginx/html;\
        index index.html index.htm;\
        include /etc/nginx/conf.d/error-handling.conf;\
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {\
            expires 30d;\
            add_header "Cache-Control" "public, max-age=2592000";\
        }\
    }\
}' > /etc/nginx/nginx.conf

# 暴露Railway使用的端口
ENV PORT=8080
EXPOSE 8080

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
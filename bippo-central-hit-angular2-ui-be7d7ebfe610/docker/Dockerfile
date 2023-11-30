FROM nginx:1.15.12

RUN mkdir -p /usr/share/nginx/hit
ADD dist /usr/share/nginx/hit/

COPY nginx.qa.conf /etc/nginx/nginx.conf
COPY .htpasswd /etc/nginx/.htpasswd

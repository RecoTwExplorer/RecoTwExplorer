FROM node:13.12.0-alpine as build
ENV RECOTW_API_HOST api
WORKDIR /usr/src
COPY . /usr/src

RUN apk add --no-cache --virtual build-dependencies \
        git && \
    npm install && \
    npm run build && \
    apk del --no-cache build-dependencies && \
    rm -rf \
        node_modules \
        /root/.npm \
        /usr/local/share/.cache \
        /tmp/*

FROM nginx:1.17.9-alpine
COPY conf /etc/nginx/conf.d
COPY --from=build /usr/src/dist /usr/share/nginx/html
CMD ["/bin/ash", "-c", "sed -i s/api\\;/$RECOTW_API_HOST\\;/ /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
